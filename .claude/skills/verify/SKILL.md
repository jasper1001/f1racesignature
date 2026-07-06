---
name: verify
description: How to run and verify changes to this Next.js site (f1racesignature)
---

# Verifying changes in this repo

Next.js 16 (Turbopack) app. The owner usually has `next dev` already running on
**port 3000** — starting a second dev server fails with "Another next dev server
is already running", so probe port 3000 first:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
```

If nothing is running: `npm run dev` (defaults to 3000).

## Driving pages

No Playwright in this repo — verify via SSR HTML. Client components are
server-rendered too, so form labels, options, countdowns etc. appear in the
`curl` output. Note React inserts `<!-- -->` comment markers inside
interpolated text, so match on substrings, not exact markup.

```bash
curl -s http://localhost:3000/<page> -o "$SCRATCHPAD/page.html"
```

Gotcha (Windows Git Bash): `/tmp` in bash ≠ `C:\tmp` in node — write captures
to the session scratchpad path instead.

## Supabase-backed features (leaderboards, predictions)

Env in `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`/`_ANON_KEY`). New SQL in
`supabase/migrations/*.sql` is applied MANUALLY by the owner in the Supabase
SQL editor — probe whether it's live via PostgREST:

```bash
curl -s "$URL/rest/v1/<table>?limit=1" -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
curl -s "$URL/rest/v1/rpc/<fn>" -X POST -H "apikey: $KEY" ... -d '{...}'
```

404 = migration not applied yet (report as pending user step, not a FAIL).
All writes go through SECURITY DEFINER RPCs; anon key cannot run DDL.

## Checks worth repeating

- `npx tsc --noEmit` and `npx eslint <files>` (compiler rules are warnings by design).
- Live F1 data comes from api.jolpi.ca (no key); pages `revalidate = 3600`.
- Smoke: `/`, `/results`, `/schedule` should all 200 after touching `lib/f1api.ts`.
