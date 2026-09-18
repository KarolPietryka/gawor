import { getAudioBucket, getDatabase, getOpenAiApiKey } from '@/db';
import { assemblePcm, AUDIO_PROFILE, audioContentDigest } from '@/lib/audio';
import { errorResponse } from '@/lib/sessions';

type SentenceRow = { german: string };
type AudioRow = {
  id: string;
  status: 'ready' | 'stale' | 'pending' | 'failed';
  object_key: string | null;
  manifest_json: string | null;
};

async function sentencesForSet(db: D1Database, practiceSetId: string) {
  return db
    .prepare(`SELECT x.german FROM sentences x
      JOIN practice_set_sentences pss ON pss.sentence_id = x.id
      WHERE pss.practice_set_id = ? ORDER BY pss.position`)
    .bind(practiceSetId)
    .all<SentenceRow>();
}

async function synthesize(text: string, apiKey: string) {
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: AUDIO_PROFILE.model,
      voice: AUDIO_PROFILE.voice,
      input: text,
      response_format: 'pcm',
      instructions:
        'Sprich den deutschen Satz klar, natürlich und in einem ruhigen Lerntempo.',
    }),
  });
  if (!response.ok) {
    console.error('TTS request failed', response.status);
    throw new Error('Usługa syntezy nie przygotowała nagrania.');
  }
  return new Uint8Array(await response.arrayBuffer());
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ practiceSetId: string }> },
) {
  const { practiceSetId } = await context.params;
  let db: D1Database;
  let pendingAssetId: string | null = null;
  try {
    db = getDatabase();
  } catch (error) {
    return errorResponse(error);
  }

  try {
    const sentenceResult = await sentencesForSet(db, practiceSetId);
    const sentences = sentenceResult.results.map((item) => item.german);
    if (!sentences.length)
      return Response.json(
        { error: 'Pusty zestaw nie może mieć nagrania.' },
        { status: 400 },
      );

    const contentHash = await audioContentDigest(sentences);
    const existing = await db
      .prepare(`SELECT id, status, object_key, manifest_json FROM audio_assets
        WHERE practice_set_id = ? AND content_hash = ?`)
      .bind(practiceSetId, contentHash)
      .first<AudioRow>();
    if (
      existing?.status === 'ready' &&
      existing.object_key &&
      existing.manifest_json
    )
      return Response.json({ status: 'ready', asset_id: existing.id });
    if (existing?.status === 'pending')
      return Response.json(
        { status: 'pending', asset_id: existing.id },
        { status: 202 },
      );

    const now = new Date().toISOString();
    const assetId = existing?.id ?? crypto.randomUUID();
    pendingAssetId = assetId;
    if (existing) {
      await db
        .prepare(`UPDATE audio_assets
          SET status = 'pending', file_url = NULL, object_key = NULL,
          manifest_json = NULL, duration_ms = NULL, updated_at = ?
          WHERE id = ?`)
        .bind(now, assetId)
        .run();
    } else {
      await db
        .prepare(`INSERT INTO audio_assets
          (id, practice_set_id, content_hash, status, file_url, voice,
          pause_multiplier_milli, duration_ms, object_key, manifest_json, created_at, updated_at)
          VALUES (?, ?, ?, 'pending', NULL, ?, ?, NULL, NULL, NULL, ?, ?)`)
        .bind(
          assetId,
          practiceSetId,
          contentHash,
          AUDIO_PROFILE.voice,
          AUDIO_PROFILE.pauseMultiplierMilli,
          now,
          now,
        )
        .run();
    }

    const apiKey = getOpenAiApiKey();
    const bucket = getAudioBucket();
    const clips = await Promise.all(
      sentences.map((sentence) => synthesize(sentence, apiKey)),
    );
    const { wav, manifest } = assemblePcm(clips);

    // Editing a sentence while TTS is running changes the profile hash and
    // marks this asset stale. Recheck immediately before publishing it.
    const latest = await sentencesForSet(db, practiceSetId);
    const latestHash = await audioContentDigest(
      latest.results.map((item) => item.german),
    );
    if (latestHash !== contentHash) {
      await db
        .prepare(
          "UPDATE audio_assets SET status = 'stale', updated_at = ? WHERE id = ? AND status = 'pending'",
        )
        .bind(new Date().toISOString(), assetId)
        .run();
      return Response.json(
        {
          error:
            'Zestaw zmienił się podczas przygotowania. Przygotuj audio ponownie.',
        },
        { status: 409 },
      );
    }

    const objectKey = `practice-sets/${practiceSetId}/${assetId}.wav`;
    await bucket.put(objectKey, wav, {
      httpMetadata: { contentType: 'audio/wav' },
    });
    const fileUrl = `/api/practice-sets/${practiceSetId}/audio/file?asset=${assetId}`;
    const publish = await db
      .prepare(`UPDATE audio_assets
        SET status = 'ready', file_url = ?, object_key = ?, manifest_json = ?,
        duration_ms = ?, updated_at = ?
        WHERE id = ? AND content_hash = ? AND status = 'pending'`)
      .bind(
        fileUrl,
        objectKey,
        JSON.stringify(manifest),
        Math.round(manifest.duration * 1000),
        new Date().toISOString(),
        assetId,
        contentHash,
      )
      .run();
    if (!publish.meta.changes) {
      await bucket.delete(objectKey);
      return Response.json(
        {
          error:
            'Zestaw zmienił się podczas przygotowania. Przygotuj audio ponownie.',
        },
        { status: 409 },
      );
    }
    return Response.json({
      status: 'ready',
      asset_id: assetId,
      file_url: fileUrl,
    });
  } catch (error) {
    console.error(error);
    // A failed asset stays visible in the library and the next POST retries it.
    try {
      if (pendingAssetId)
        await db
          .prepare(
            "UPDATE audio_assets SET status = 'failed', updated_at = ? WHERE id = ? AND status = 'pending'",
          )
          .bind(new Date().toISOString(), pendingAssetId)
          .run();
    } catch {
      // Preserve the original synthesis failure.
    }
    return Response.json(
      { error: 'Nie udało się przygotować audio. Spróbuj ponownie.' },
      { status: 502 },
    );
  }
}
