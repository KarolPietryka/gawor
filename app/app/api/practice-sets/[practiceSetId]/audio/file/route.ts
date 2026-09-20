import { getAudioBucket, getDatabase } from '@/db';
import { audioContentDigest } from '@/lib/audio';
import { errorResponse } from '@/lib/sessions';

type AudioRow = {
  object_key: string;
  content_hash: string;
  status: string;
};
type SentenceRow = { german: string };
type ByteRange = { offset: number; length: number };

function parseByteRange(value: string | null, size: number) {
  if (!value || !value.startsWith('bytes=')) return null;
  const match = /^(\d*)-(\d*)$/.exec(value.slice('bytes='.length));
  if (!match || (!match[1] && !match[2])) return null;
  const startValue = match[1] ? Number(match[1]) : null;
  const endValue = match[2] ? Number(match[2]) : null;
  if (
    (startValue !== null && !Number.isSafeInteger(startValue)) ||
    (endValue !== null && !Number.isSafeInteger(endValue))
  )
    return null;
  if (startValue === null) {
    if (!endValue || size === 0) return 'unsatisfiable' as const;
    const length = Math.min(endValue, size);
    return { offset: size - length, length } satisfies ByteRange;
  }
  const end = endValue === null ? size - 1 : Math.min(endValue, size - 1);
  if (size === 0 || startValue >= size || end < startValue)
    return 'unsatisfiable' as const;
  return { offset: startValue, length: end - startValue + 1 } satisfies ByteRange;
}

function audioHeaders(object: R2Object) {
  return new Headers({
    'accept-ranges': 'bytes',
    'cache-control': 'private, no-store',
    'content-type': object.httpMetadata?.contentType ?? 'audio/wav',
  });
}

async function currentObjectKey(practiceSetId: string, assetId: string) {
  const db = getDatabase();
  const asset = await db
    .prepare(`SELECT object_key, content_hash, status FROM audio_assets
      WHERE id = ? AND practice_set_id = ?`)
    .bind(assetId, practiceSetId)
    .first<AudioRow>();
  if (!asset?.object_key || asset.status !== 'ready')
    return Response.json({ error: 'Nagranie nie jest gotowe.' }, { status: 404 });
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
  return asset.object_key;
}

async function respond(
  request: Request,
  context: { params: Promise<{ practiceSetId: string }> },
  includeBody: boolean,
) {
  const { practiceSetId } = await context.params;
  const assetId = new URL(request.url).searchParams.get('asset');
  if (!assetId)
    return Response.json({ error: 'Brak nagrania.' }, { status: 400 });
  try {
    const objectKey = await currentObjectKey(practiceSetId, assetId);
    if (objectKey instanceof Response) return objectKey;

    const bucket = getAudioBucket();
    const metadata = await bucket.head(objectKey);
    if (!metadata)
      return Response.json(
        { error: 'Nie znaleziono pliku nagrania.' },
        { status: 404 },
      );
    const range = parseByteRange(request.headers.get('range'), metadata.size);
    const headers = audioHeaders(metadata);
    if (range === 'unsatisfiable') {
      headers.set('content-range', `bytes */${metadata.size}`);
      return new Response(null, { status: 416, headers });
    }
    if (range) {
      headers.set('content-length', String(range.length));
      headers.set(
        'content-range',
        `bytes ${range.offset}-${range.offset + range.length - 1}/${metadata.size}`,
      );
      if (!includeBody) return new Response(null, { status: 206, headers });
      const object = await bucket.get(objectKey, { range });
      if (!object)
        return Response.json(
          { error: 'Nie znaleziono pliku nagrania.' },
          { status: 404 },
        );
      return new Response(object.body, { status: 206, headers });
    }

    headers.set('content-length', String(metadata.size));
    if (!includeBody) return new Response(null, { headers });
    const object = await bucket.get(objectKey);
    if (!object)
      return Response.json(
        { error: 'Nie znaleziono pliku nagrania.' },
        { status: 404 },
      );
    return new Response(object.body, { headers });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ practiceSetId: string }> },
) {
  return respond(request, context, true);
}

export async function HEAD(
  request: Request,
  context: { params: Promise<{ practiceSetId: string }> },
) {
  return respond(request, context, false);
}
