import { getDatabase } from '@/db';
import {
  cleanText,
  digest,
  errorResponse,
  listSessions,
  normalizeGerman,
} from '@/lib/sessions';

type IncomingSentence = { german?: unknown; polish?: unknown; note?: unknown };
type IncomingVocabulary = { german?: unknown; polish?: unknown };

export async function GET() {
  try {
    return Response.json({ sessions: await listSessions() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  let body: {
    session_summary?: unknown;
    title?: unknown;
    sentences?: IncomingSentence[];
    vocabulary?: IncomingVocabulary[];
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Niepoprawny JSON.' }, { status: 400 });
  }

  if (!body || !Array.isArray(body.sentences) || body.sentences.length === 0) {
    return Response.json(
      { error: 'Sesja musi zawierać co najmniej jedno zdanie.' },
      { status: 400 },
    );
  }
  if (body.sentences.length > 100) {
    return Response.json(
      { error: 'Jedna sesja może zawierać maksymalnie 100 zdań.' },
      { status: 400 },
    );
  }

  const seen = new Set<string>();
  const sentences = body.sentences
    .map((item) => ({
      german: normalizeGerman(item?.german),
      polish: cleanText(item?.polish, 500),
      note: cleanText(item?.note, 500),
    }))
    .filter((item) => {
      const key = item.german.toLocaleLowerCase('de-DE');
      if (!item.german || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  if (!sentences.length) {
    return Response.json(
      { error: 'Nie znaleziono poprawnych zdań niemieckich.' },
      { status: 400 },
    );
  }

  let db: D1Database;
  try {
    db = getDatabase();
  } catch (error) {
    return errorResponse(error);
  }
  const sessionId = crypto.randomUUID();
  const practiceSetId = crypto.randomUUID();
  const now = new Date().toISOString();
  const summary = cleanText(body.session_summary, 1000);
  const fallbackTitle = summary
    ? summary.slice(0, 80)
    : `Sesja ${new Intl.DateTimeFormat('pl-PL').format(new Date())}`;
  const title = cleanText(body.title, 100) || fallbackTitle;
  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        'INSERT INTO sessions (id, summary, created_at) VALUES (?, ?, ?)',
      )
      .bind(sessionId, summary, now),
    db
      .prepare(
        'INSERT INTO practice_sets (id, session_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      )
      .bind(practiceSetId, sessionId, title, now, now),
  ];

  for (const [position, item] of sentences.entries()) {
    const sentenceId = crypto.randomUUID();
    statements.push(
      db
        .prepare(
          'INSERT INTO sentences (id, session_id, german, polish, note, text_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        )
        .bind(
          sentenceId,
          sessionId,
          item.german,
          item.polish,
          item.note,
          await digest(item.german),
          now,
          now,
        ),
    );
    statements.push(
      db
        .prepare(
          'INSERT INTO practice_set_sentences (practice_set_id, sentence_id, position) VALUES (?, ?, ?)',
        )
        .bind(practiceSetId, sentenceId, position),
    );
  }

  const wordSeen = new Set<string>();
  for (const item of Array.isArray(body.vocabulary) ? body.vocabulary : []) {
    const german = cleanText(item?.german, 120);
    const polish = cleanText(item?.polish, 240);
    const key = german.toLocaleLowerCase('de-DE');
    if (!german || wordSeen.has(key)) continue;
    wordSeen.add(key);
    statements.push(
      db
        .prepare(
          'INSERT INTO vocabulary (id, session_id, german, polish) VALUES (?, ?, ?, ?)',
        )
        .bind(crypto.randomUUID(), sessionId, german, polish),
    );
  }

  try {
    await db.batch(statements);
    return Response.json(
      {
        id: sessionId,
        practice_set_id: practiceSetId,
        summary,
        sentence_count: sentences.length,
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
