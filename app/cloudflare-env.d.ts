declare namespace Cloudflare {
  interface Env {
    GAWOR_DB?: D1Database;
    GAWOR_AUDIO?: R2Bucket;
    OPENAI_API_KEY?: string;
  }
}
