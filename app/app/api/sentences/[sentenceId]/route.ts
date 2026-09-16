import { getDatabase } from '@/db';
import {
  cleanText,
  digest,
  errorResponse,
  markSetChanged,
  normalizeGerman,
} from '@/lib/sessions';

type SentenceLocation = {
  id: string;
  session_id: string;
  practice_set_id: string;
  position: number;
};

async function locate(id: string) {
  return getDatabase()
    .prepare(`SELECT x.id, x.session_id, pss.practice_set_id, pss.position
    FROM sentences x JOIN practice_set_sentences pss ON pss.sentence_id = x.id WHERE x.id = ?`)
    .bind(id)
    .first<SentenceLocation>();
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ sentenceId: string }> },
) {
  const { sentenceId } = await context.params;
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
      { error: 'Zdanie po niemiecku nie może być puste.' },
      { status: 400 },
    );

  let db: D1Database;
  try {
    db = getDatabase();
  } catch (error) {
    return errorResponse(error);
  }
  try {
    const location = await locate(sentenceId);
    if (!location)
      return Response.json(
        { error: 'Nie znaleziono zdania.' },
        { status: 404 },
      );
    const hash = await digest(german);
    const duplicate = await db
      .prepare(
        'SELECT id FROM sentences WHERE session_id = ? AND text_hash = ? AND id <> ?',
      )
      .bind(location.session_id, hash, sentenceId)
      .first();
    if (duplicate)
      return Response.json(
        { error: 'To zdanie jest już w tej sesji.' },
        { status: 409 },
      );
    const now = new Date().toISOString();
    await db.batch([
      db
        .prepare(
          'UPDATE sentences SET german = ?, polish = ?, note = ?, text_hash = ?, updated_at = ? WHERE id = ?',
        )
        .bind(
          german,
          cleanText(body.polish, 500),
          cleanText(body.note, 500),
          hash,
          now,
          sentenceId,
        ),
      ...markSetChanged(db, location.practice_set_id, now),
    ]);
    return Response.json({ id: sentenceId });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ sentenceId: string }> },
) {
  const { sentenceId } = await context.params;
  let db: D1Database;
  try {
    db = getDatabase();
  } catch (error) {
    return errorResponse(error);
  }
  try {
    const location = await locate(sentenceId);
    if (!location)
      return Response.json(
        { error: 'Nie znaleziono zdania.' },
        { status: 404 },
      );
    const now = new Date().toISOString();
    await db.batch([
      db
        .prepare(
          'DELETE FROM practice_set_sentences WHERE practice_set_id = ? AND sentence_id = ?',
        )
        .bind(location.practice_set_id, sentenceId),
      db.prepare('DELETE FROM sentences WHERE id = ?').bind(sentenceId),
      db
        .prepare(
          'UPDATE practice_set_sentences SET position = position - 1 WHERE practice_set_id = ? AND position > ?',
        )
        .bind(location.practice_set_id, location.position),
      ...markSetChanged(db, location.practice_set_id, now),
    ]);
    return Response.json({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
