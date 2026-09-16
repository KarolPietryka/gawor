import fixtureSentences from '@/app/sentences.json';
import manifest from '@/public/audio/practice.json';
import { getDatabase } from '@/db';
import { contentDigest, errorResponse } from '@/lib/sessions';

type SentenceRow = { german: string };

export async function POST(
  _request: Request,
  context: { params: Promise<{ practiceSetId: string }> },
) {
  const { practiceSetId } = await context.params;
  let db: D1Database;
  try {
    db = getDatabase();
  } catch (error) {
    return errorResponse(error);
  }
  try {
    const result = await db
      .prepare(`SELECT x.german FROM sentences x
      JOIN practice_set_sentences pss ON pss.sentence_id = x.id
      WHERE pss.practice_set_id = ? ORDER BY pss.position`)
      .bind(practiceSetId)
      .all<SentenceRow>();
    if (!result.results.length)
      return Response.json(
        { error: 'Pusty zestaw nie może mieć nagrania.' },
        { status: 400 },
      );
    const contentHash = await contentDigest(
      result.results.map((item) => item.german),
    );
    const fixtureHash = await contentDigest(
      fixtureSentences.map((item) => item.de),
    );
    if (contentHash !== fixtureHash) {
      return Response.json(
        {
          error:
            'Ten zestaw wymaga nowej syntezy głosu. Dostawca dynamicznego TTS nie jest jeszcze skonfigurowany.',
          audio_status: 'missing',
        },
        { status: 409 },
      );
    }
    const now = new Date().toISOString();
    await db.batch([
      db
        .prepare(
          "UPDATE audio_assets SET status = 'stale', updated_at = ? WHERE practice_set_id = ? AND status = 'ready'",
        )
        .bind(now, practiceSetId),
      db
        .prepare(`INSERT INTO audio_assets
        (id, practice_set_id, content_hash, status, file_url, voice, pause_multiplier_milli, duration_ms, created_at, updated_at)
        VALUES (?, ?, ?, 'ready', ?, 'de-DE-KatjaNeural', 1500, ?, ?, ?)`)
        .bind(
          crypto.randomUUID(),
          practiceSetId,
          contentHash,
          `/audio/${manifest.file}`,
          Math.round(manifest.duration * 1000),
          now,
          now,
        ),
    ]);
    return Response.json({
      status: 'ready',
      file_url: `/audio/${manifest.file}`,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
