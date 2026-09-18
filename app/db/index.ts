import { env } from 'cloudflare:workers';

export function getDatabase(): D1Database {
  if (!env.GAWOR_DB)
    throw new Error('Baza GAWOR_DB jest chwilowo niedostępna.');
  return env.GAWOR_DB;
}

export function getAudioBucket(): R2Bucket {
  if (!env.GAWOR_AUDIO)
    throw new Error('Magazyn nagrań jest chwilowo niedostępny.');
  return env.GAWOR_AUDIO;
}

export function getOpenAiApiKey(): string {
  if (!env.OPENAI_API_KEY)
    throw new Error('Synteza głosu nie jest jeszcze skonfigurowana.');
  return env.OPENAI_API_KEY;
}
