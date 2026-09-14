import { env } from 'cloudflare:workers';

type IncomingSentence = { german?: unknown; polish?: unknown; note?: unknown };
type IncomingVocabulary = { german?: unknown; polish?: unknown };

const text = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const json = (data: unknown, status = 200) => Response.json(data, { status });

export async function GET() {
  await ensureSchema();
  const sessions = await env.GAWOR_DB.prepare(
    'SELECT id, summary, created_at FROM sessions ORDER BY created_at DESC',
  ).all();
  const sentences = await env.GAWOR_DB.prepare(
    'SELECT id, session_id, german, polish, note, created_at, updated_at FROM sentences ORDER BY created_at ASC',
  ).all();
  const vocabulary = await env.GAWOR_DB.prepare(
    'SELECT id, session_id, german, polish FROM vocabulary ORDER BY german ASC',
  ).all();
  return json({
    sessions: sessions.results.map(session => ({
      ...session,
      sentences: sentences.results.filter(sentence => sentence.session_id === session.id),
      vocabulary: vocabulary.results.filter(word => word.session_id === session.id),
    })),
  });
}

export async function POST(request: Request) {
  await ensureSchema();
  let body: { session_summary?: unknown; sentences?: IncomingSentence[]; vocabulary?: IncomingVocabulary[] };
  try { body = await request.json(); } catch { return json({ error: 'Niepoprawny JSON.' }, 400); }
  if (!body || !Array.isArray(body.sentences) || body.sentences.length === 0) {
    return json({ error: 'Sesja musi zawierać co najmniej jedno zdanie.' }, 400);
  }
  const seen = new Set<string>();
  const cleanSentences = body.sentences.map(item => ({
    german: text(item?.german, 500), polish: text(item?.polish, 500), note: text(item?.note, 500),
  })).filter(item => item.german && !seen.has(item.german) && seen.add(item.german));
  if (!cleanSentences.length) return json({ error: 'Nie znaleziono poprawnych zdań niemieckich.' }, 400);
  const sessionId = crypto.randomUUID();
  const now = new Date().toISOString();
  const summary = text(body.session_summary, 1000);
  const statements: D1PreparedStatement[] = [env.GAWOR_DB.prepare(
    'INSERT INTO sessions (id, summary, created_at) VALUES (?, ?, ?)',
  ).bind(sessionId, summary, now)];
  for (const [index, item] of cleanSentences.entries()) {
    const id = `${sessionId}-${String(index + 1).padStart(3, '0')}`;
    const hash = await digest(item.german);
    statements.push(env.GAWOR_DB.prepare(
      'INSERT INTO sentences (id, session_id, german, polish, note, text_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ).bind(id, sessionId, item.german, item.polish, item.note, hash, now, now));
  }
  const words = Array.isArray(body.vocabulary) ? body.vocabulary : [];
  const wordSeen = new Set<string>();
  for (const item of words) {
    const german = text(item?.german, 120); const polish = text(item?.polish, 240);
    if (!german || wordSeen.has(german)) continue;
    wordSeen.add(german);
    statements.push(env.GAWOR_DB.prepare(
      'INSERT INTO vocabulary (id, session_id, german, polish) VALUES (?, ?, ?, ?)',
    ).bind(crypto.randomUUID(), sessionId, german, polish));
  }
  await env.GAWOR_DB.batch(statements);
  return json({ id: sessionId, summary, sentence_count: cleanSentences.length }, 201);
}

async function digest(value: string) {
  const bytes = new TextEncoder().encode(value.toLocaleLowerCase('de-DE'));
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function ensureSchema() {
  await env.GAWOR_DB.batch([
    env.GAWOR_DB.prepare('CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, summary TEXT NOT NULL DEFAULT \'\', created_at TEXT NOT NULL)'),
    env.GAWOR_DB.prepare('CREATE TABLE IF NOT EXISTS sentences (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, german TEXT NOT NULL, polish TEXT NOT NULL DEFAULT \'\', note TEXT NOT NULL DEFAULT \'\', text_hash TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)'),
    env.GAWOR_DB.prepare('CREATE TABLE IF NOT EXISTS vocabulary (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, german TEXT NOT NULL, polish TEXT NOT NULL DEFAULT \'\', UNIQUE(session_id, german))'),
  ]);
}
