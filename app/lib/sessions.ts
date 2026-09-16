import { getDatabase } from '@/db';

export type SessionSentence = {
  id: string;
  german: string;
  polish: string;
  note: string;
  position: number;
  created_at: string;
  updated_at: string;
};

type SessionRow = {
  id: string;
  summary: string;
  created_at: string;
  practice_set_id: string;
  practice_set_title: string;
};
type SentenceRow = SessionSentence & {
  session_id: string;
  practice_set_id: string;
};
type VocabularyRow = {
  id: string;
  session_id: string;
  german: string;
  polish: string;
};
type AudioRow = {
  id: string;
  practice_set_id: string;
  content_hash: string;
  status: 'ready' | 'stale' | 'pending' | 'failed';
  file_url: string | null;
  voice: string;
  pause_multiplier_milli: number;
  duration_ms: number | null;
  updated_at: string;
};

export function cleanText(value: unknown, max: number) {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').slice(0, max)
    : '';
}

export function normalizeGerman(value: unknown) {
  return cleanText(value, 500).normalize('NFC');
}

export async function digest(value: string) {
  const bytes = new TextEncoder().encode(value.toLocaleLowerCase('de-DE'));
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

export async function contentDigest(sentences: string[]) {
  return digest(
    sentences.map((sentence) => normalizeGerman(sentence)).join('\n'),
  );
}

export async function listSessions() {
  const db = getDatabase();
  const [sessionResult, sentenceResult, vocabularyResult, audioResult] =
    await Promise.all([
      db
        .prepare(`SELECT s.id, s.summary, s.created_at, p.id AS practice_set_id, p.title AS practice_set_title
      FROM sessions s JOIN practice_sets p ON p.session_id = s.id ORDER BY s.created_at DESC`)
        .all<SessionRow>(),
      db
        .prepare(`SELECT x.id, x.session_id, x.german, x.polish, x.note, x.created_at, x.updated_at,
      pss.practice_set_id, pss.position FROM sentences x
      JOIN practice_set_sentences pss ON pss.sentence_id = x.id
      ORDER BY pss.practice_set_id, pss.position`)
        .all<SentenceRow>(),
      db
        .prepare(
          'SELECT id, session_id, german, polish FROM vocabulary ORDER BY german',
        )
        .all<VocabularyRow>(),
      db
        .prepare(`SELECT id, practice_set_id, content_hash, status, file_url, voice,
      pause_multiplier_milli, duration_ms, updated_at FROM audio_assets ORDER BY updated_at DESC`)
        .all<AudioRow>(),
    ]);

  const audioBySet = new Map<string, AudioRow>();
  for (const asset of audioResult.results)
    if (!audioBySet.has(asset.practice_set_id))
      audioBySet.set(asset.practice_set_id, asset);

  return Promise.all(
    sessionResult.results.map(async (session) => {
      const sentences = sentenceResult.results.filter(
        (item) => item.session_id === session.id,
      );
      const audio = audioBySet.get(session.practice_set_id) ?? null;
      const currentHash = await contentDigest(
        sentences.map((item) => item.german),
      );
      return {
        id: session.id,
        summary: session.summary,
        created_at: session.created_at,
        sentences,
        vocabulary: vocabularyResult.results.filter(
          (item) => item.session_id === session.id,
        ),
        practice_set: {
          id: session.practice_set_id,
          title: session.practice_set_title,
          audio: audio
            ? {
                ...audio,
                is_current:
                  audio.status === 'ready' &&
                  audio.content_hash === currentHash,
              }
            : null,
        },
      };
    }),
  );
}

export function markSetChanged(
  db: D1Database,
  practiceSetId: string,
  now: string,
) {
  return [
    db
      .prepare('UPDATE practice_sets SET updated_at = ? WHERE id = ?')
      .bind(now, practiceSetId),
    db
      .prepare(
        "UPDATE audio_assets SET status = 'stale', updated_at = ? WHERE practice_set_id = ? AND status = 'ready'",
      )
      .bind(now, practiceSetId),
  ];
}

export function errorResponse(error: unknown) {
  console.error(error);
  return Response.json(
    { error: 'Dane są chwilowo niedostępne. Spróbuj ponownie.' },
    { status: 503 },
  );
}
