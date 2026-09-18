import { getAudioBucket, getDatabase } from '@/db';
import { audioContentDigest } from '@/lib/audio';
import { errorResponse } from '@/lib/sessions';

type AudioRow = {
  object_key: string;
  content_hash: string;
  status: string;
};
type SentenceRow = { german: string };

export async function GET(
  request: Request,
  context: { params: Promise<{ practiceSetId: string }> },
) {
  const { practiceSetId } = await context.params;
  const assetId = new URL(request.url).searchParams.get('asset');
  if (!assetId)
    return Response.json({ error: 'Brak nagrania.' }, { status: 400 });
  try {
    const db = getDatabase();
    const asset = await db
      .prepare(`SELECT object_key, content_hash, status FROM audio_assets
        WHERE id = ? AND practice_set_id = ?`)
      .bind(assetId, practiceSetId)
      .first<AudioRow>();
    if (!asset?.object_key || asset.status !== 'ready')
      return Response.json(
        { error: 'Nagranie nie jest gotowe.' },
        { status: 404 },
      );
    const sentences = await db
      .prepare(`SELECT x.german FROM sentences x
        JOIN practice_set_sentences pss ON pss.sentence_id = x.id
        WHERE pss.practice_set_id = ? ORDER BY pss.position`)
      .bind(practiceSetId)
      .all<SentenceRow>();
    if (
      asset.content_hash !==
      (await audioContentDigest(sentences.results.map((item) => item.german)))
    )
      return Response.json(
        { error: 'Nagranie nie jest aktualne.' },
        { status: 409 },
      );
    const object = await getAudioBucket().get(asset.object_key);
    if (!object)
      return Response.json(
        { error: 'Nie znaleziono pliku nagrania.' },
        { status: 404 },
      );
    return new Response(object.body, {
      headers: {
        'content-type': object.httpMetadata?.contentType ?? 'audio/wav',
        'cache-control': 'private, no-store',
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
