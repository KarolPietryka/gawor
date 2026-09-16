import { env } from 'cloudflare:workers';

export function getDatabase(): D1Database {
  if (!env.GAWOR_DB)
    throw new Error('Baza GAWOR_DB jest chwilowo niedostępna.');
  return env.GAWOR_DB;
}
