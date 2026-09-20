# Private Cloudflare deployment

Log in with `wrangler login`, then create a private D1 database and R2 bucket.
Set `GAWOR_D1_DATABASE_NAME`, `GAWOR_D1_DATABASE_ID`, and
`GAWOR_R2_BUCKET_NAME` before building (see `.env.example`). Apply every SQL
migration in `drizzle/`, set the Worker secret with `wrangler secret put
OPENAI_API_KEY`, and run `npm run deploy`.

The `site-creator-*` names are local fallbacks only. Never commit `.dev.vars`,
Cloudflare credentials, or generated `.wrangler` state.
