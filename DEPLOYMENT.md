# CiteWing's Minilytics instance

Source backup: https://github.com/tomhan245/minilytics
Original project: https://github.com/surendrapandar/minilytics
Live dashboard: https://minilytics.tomhan.workers.dev

This fork preserves the original Git history and our small integration patch:

- `public/js/script.js`: optional private-route exclusions and safe URL query/referrer handling.
- `src/worker/payments.ts`: an optional payment goal, stored atomically with revenue and deduplicated on retries.
- `test/tracker.test.ts`: private-route and URL regression coverage.
- `src/worker/index.ts` and `src/dashboard/components/GoalsPanel.tsx`: 12-step funnels, supporting CiteWing's nine landing sections followed by sign-in and checkout.
- `wrangler.jsonc`: this instance's Worker/D1 configuration. The database ID is an identifier, not a credential.

## Upstream updates

`Sync upstream` checks the original `main` hourly, at minute 17 (GitHub may delay scheduled runs). It merges rather than resets, preserving our commits. A new merge reaches this fork's `main` only after `npm ci`, typecheck, tests and build pass. Conflicts, failing checks or a concurrent push stop the update and produce a failed Actions run; the current branch stays unchanged. Resolve that failure before expecting newer upstream code.

You can run the workflow manually from the Actions tab. After 60 days without repository activity GitHub may disable scheduled workflows on public repositories; re-enable `Sync upstream` from Actions if that happens. Check Actions for the last successful run rather than assuming every hourly trigger ran.

After a checked upstream merge reaches this fork’s `main`, Cloudflare Workers Builds automatically deploys it to the existing `minilytics` Worker. Direct pushes to `main` also trigger deployment. Cloudflare runs typecheck, tests and build before applying D1 migrations and deploying. A failure stops deployment. GitHub Actions holds no Cloudflare credentials; deployment uses the existing Cloudflare build token and Worker secrets.

Cloudflare configuration:

- Production branch: `main`; root directory: `/`.
- Build: `npm run typecheck && npm test && npm run build`.
- Deploy: `npx wrangler d1 migrations apply minilytics --remote && npx wrangler deploy`.
- Node version: `24.22.1`.
- Build trigger: `318e2fad-8fce-4ef1-907b-1106deb7164a`.
- Cloudflare dashboard: https://dash.cloudflare.com/aef548048a7aef925dea60dd63f3da76/workers/services/view/minilytics/production/settings/builds

Automatic deployments include upstream migrations. Review the failed build logs if a migration or deployment fails; source sync alone does not prove the live Worker updated.

## Recover after losing the local checkout

```sh
git clone https://github.com/tomhan245/minilytics.git
cd minilytics
git remote add upstream https://github.com/surendrapandar/minilytics.git
npm ci
npx wrangler login
```

Cloudflare retains the D1 database and Worker secrets independently of the local folder. Do not create a replacement database: `wrangler.jsonc` already points to the existing `minilytics` database. Source control is not a database backup.

The deployed `ADMIN_PASSWORD` and `SESSION_SECRET` are not committed. They remain in Cloudflare. A redeploy preserves existing secrets. If the dashboard password is lost, reset it using `npx wrangler secret put ADMIN_PASSWORD`; do not expose it in command arguments or Git. For local development, copy `.dev.vars.example` to ignored `.dev.vars` and use local-only credentials.

## Manual deployment after recovery

```sh
git pull --ff-only origin main
npm ci
npm run typecheck
npm test
npm run deploy
```

Read the upstream changes before deployment, especially migrations and breaking changes. The upstream deploy command builds, applies remote D1 migrations, then deploys. Do not run it for a source-only update.

The original pilot was deployed manually from upstream `41e384c` plus the integration patch, as Cloudflare version `8d37ec0f-57e1-42a7-b157-2e8c50158b2f`. Current deployments are tracked by their Git commit in Cloudflare Builds.
