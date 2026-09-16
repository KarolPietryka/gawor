import { getDatabase } from '@/db';
import {
  cleanText,
  digest,
  errorResponse,
  markSetChanged,
  normalizeGerman,
} from '@/lib/sessions';

export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;
  let body: { german?: unknown; polish?: unknown; note?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: 'Niepoprawne dane zdania.' },
      { status: 400 },
    );
  }
  const german = normalizeGerman(body.german);
  if (!german)
    return Response.json(
      { error: 'Wpisz zdanie po niemiecku.' },
      { status: 400 },
    );

  let db: D1Database;
  try {
    db = getDatabase();
  } catch (error) {
    return errorResponse(error);
  }
  try {
    const practiceSet = await db
      .prepare('SELECT id FROM practice_sets WHERE session_id = ?')
      .bind(sessionId)
      .first<{ id: string }>();
    if (!practiceSet)
      return Response.json({ error: 'Nie znaleziono sesji.' }, { status: 404 });
    const hash = await digest(german);
    const duplicate = await db
      .prepare(
        'SELECT id FROM sentences WHERE session_id = ? AND text_hash = ?',
      )
      .bind(sessionId, hash)
      .first();
    if (duplicate)
      return Response.json(
        { error: 'To zdanie jest już w tej sesji.' },
        { status: 409 },
      );
    const positionRow = await db
      .prepare(
        'SELECT COALESCE(MAX(position), -1) + 1 AS position FROM practice_set_sentences WHERE practice_set_id = ?',
      )
      .bind(practiceSet.id)
      .first<{ position: number }>();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.batch([
      db
        .prepare(
          'INSERT INTO sentences (id, session_id, german, polish, note, text_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        )
        .bind(
          id,
          sessionId,
          german,
          cleanText(body.polish, 500),
          cleanText(body.note, 500),
          hash,
          now,
          now,
        ),
      db
        .prepare(
          'INSERT INTO practice_set_sentences (practice_set_id, sentence_id, position) VALUES (?, ?, ?)',
        )
        .bind(practiceSet.id, id, positionRow?.position ?? 0),
      ...markSetChanged(db, practiceSet.id, now),
    ]);
    return Response.json({ id }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
