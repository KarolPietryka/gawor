import { env } from 'cloudflare:workers';

export class AudioConfigurationError extends Error {}

export function getDatabase(): D1Database {
  if (!env.GAWOR_DB)
    throw new Error('Baza GAWOR_DB jest chwilowo niedostępna.');
  return env.GAWOR_DB;
}

export function getAudioBucket(): R2Bucket {
  if (!env.GAWOR_AUDIO)
    throw new AudioConfigurationError(
      'Lokalny magazyn audio GAWOR_AUDIO jest niedostępny. Sprawdź lokalne bindingi R2.',
    );
  return env.GAWOR_AUDIO;
}

export function getOpenAiApiKey(): string {
  if (!env.OPENAI_API_KEY)
    throw new AudioConfigurationError(
      'Brakuje OPENAI_API_KEY. Dodaj klucz do app/.dev.vars i uruchom ponownie serwer.',
    );
  return env.OPENAI_API_KEY;
}
