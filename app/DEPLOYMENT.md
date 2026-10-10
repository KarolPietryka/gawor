# Release to Cloudflare Workers

The production target is the Worker `gawor` at
`https://gawor.karol-pietryka11.workers.dev/`. ChatGPT Sites is a separate
hosting product; publishing there does not update this Worker.

## Release checklist

Run commands from `app/` in PowerShell:

1. Check the Cloudflare account. Run `npx wrangler whoami`. If it reports that
   Wrangler is not authenticated, run `npx wrangler login` and complete the
   browser authorization.
2. Use the existing production resources. The D1 database is `gawor`
   (`8f3574d3-4e02-4beb-adf1-7037fb86179f`) and the R2 bucket is
   `gawor-audio`. Do not create new resources for a release.
3. Make the build use those bindings:

   ```powershell
   $env:GAWOR_D1_DATABASE_NAME = 'gawor'
   $env:GAWOR_D1_DATABASE_ID = '8f3574d3-4e02-4beb-adf1-7037fb86179f'
   $env:GAWOR_R2_BUCKET_NAME = 'gawor-audio'
   npm run deploy
   ```

4. Before deploying, if the generated `dist/server/wrangler.json` needs
   inspection, confirm it has `name: "gawor"`, `workers_dev: true`, D1
   `gawor`, and R2 `gawor-audio`. The package name `sites-project` and
   `site-creator-*` resources are not the production target.
5. Confirm Wrangler reports deployment to
   `https://gawor.karol-pietryka11.workers.dev`.

## Secrets and database

- Worker secrets are separate from ChatGPT Sites hosted secrets. Set
  `OPENAI_API_KEY` on the `gawor` Worker (once, or when rotating it) with
  `npx wrangler secret put OPENAI_API_KEY --config dist/server/wrangler.json`.
  Run it after a build has generated that config. Wrangler prompts for the
  value. Never commit or print the value. Local development reads `.dev.vars`.
- Check that remote D1 migrations are needed before applying them. The
  production database already contains the app tables; blindly replaying
  `drizzle/0000_flowery_stranger.sql` fails because those tables exist. A
  D1 list showing zero tables is not enough to establish that the schema is
  empty; inspect `sqlite_master` first. When a new migration is needed, apply
  its SQL explicitly with `npx wrangler d1 execute gawor --remote
  --file=drizzle/<migration>.sql` only after confirming it has not already
  been applied.
- The current production schema includes migrations `0000` and `0001` from
  `drizzle/`. Apply only new, unapplied migration files.

Never commit `.dev.vars`, Cloudflare credentials, or generated `.wrangler`
state.
