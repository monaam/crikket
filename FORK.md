# Trybe fork of Crikket

Self-hosted at **https://feedback.thetrybe.xyz**. Branch `trybe` = upstream `master` + the patches below.
Upstream: https://github.com/redpangilinan/crikket (AGPL-3.0 — this fork stays public).

## Patches carried

| # | Files | Why |
|---|-------|-----|
| 1 | `packages/auth/src/lib/email/send-auth-email.ts`, `packages/env/src/server.ts`, `apps/server/.env.example` | Email goes through Postmark (`POST https://api.postmarkapp.com/email`) instead of Resend. Env: `POSTMARK_SERVER_TOKEN`, `POSTMARK_FROM_EMAIL`, `POSTMARK_FROM_NAME`, `POSTMARK_MESSAGE_STREAM`. Still throws in production when unconfigured. |
| 2 | `packages/env/src/server.ts` | `ENABLE_PAYMENTS` defaults to `false` (upstream: `true`, which puts every org on the `free` plan = no reports). Prod `.env` also sets it explicitly. |
| 3 | `apps/extension/.env.production`, `apps/extension/wxt.config.ts` | Extension builds target feedback.thetrybe.xyz; manifest `key` pins the extension ID to `jpclpbgghajgfmgnahclacibedmhhpfp` (allowed in the S3 bucket CORS). |
| 4 | `packages/auth/scripts/create-user.ts` | Signups are closed (`ALLOWED_SIGNUP_DOMAINS=signup-disabled.invalid`), which blocks *every* better-auth user creation incl. invitations and the admin plugin. This script inserts users directly. |
| 5 | `docker-compose.trybe.yml`, `deploy/trybe/*` | Build images from the fork, bind Postgres/app ports to localhost, video expiry + DB backup cron scripts. |

## Updating from upstream

```bash
git fetch upstream
git checkout trybe
git rebase upstream/master          # conflicts only expected in the files above
# Re-check after rebase:
grep -rn "resend\|RESEND_" packages apps --include=*.ts   # new Resend call sites need the Postmark path
grep -n "ENABLE_PAYMENTS" -A3 packages/env/src/server.ts   # default must still be "false"
grep -n "databaseHooks" -A20 packages/auth/src/index.ts   # signup block still in user.create.before?
git push --force-with-lease origin trybe
```

Then deploy (on the server) and, if `apps/extension` changed, rebuild the extension and tell everyone to reload it (see below).

## Server

- EC2 `i-0a7a196fe29c8fb31` (t3.medium, **eu-west-1**, Elastic IP 52.51.54.244), AWS profile `trybe`. SSH: `ssh -i ~/.ssh/crikket-feedback.pem ubuntu@52.51.54.244`.
  eu-west-3 was at its 8 vCPU quota, hence Ireland.
- Checkout at `~/crikket` (branch `trybe`). Env: `~/crikket/.env`, `apps/server/.env`, `apps/web/.env` (not in git).
- S3 bucket `trybe-crikket-feedback` (eu-west-3), private, SSE-S3. IAM user `crikket-feedback-s3` can only touch this bucket.
- Postmark server "Crikket Feedback" (ID 21025120), From `noreply@thetrybe.xyz`.

Deploy / update:

```bash
cd ~/crikket && git pull
docker compose -f docker-compose.yml -f docker-compose.caddy.yml -f docker-compose.trybe.yml up -d --build
```

Cron (`crontab -l` as ubuntu):

- `deploy/trybe/expire-videos.sh` daily: deletes `…/capture/video.webm` older than 90 days (S3 lifecycle can't match on key suffix).
- `deploy/trybe/backup-db.sh` nightly: `pg_dump` → `s3://trybe-crikket-feedback/backups/` (30-day lifecycle).

## Accounts

Create users and add them to organisations (org slugs are shown in Settings):

```bash
cd ~/crikket
docker compose -f docker-compose.yml -f docker-compose.caddy.yml -f docker-compose.trybe.yml exec server \
  bun packages/auth/scripts/create-user.ts --email jane@thetrybe.xyz --name "Jane Doe" --org fatoura --org trybe:admin
```

Without `--password` a temporary password is printed. The user can also sign in with an emailed code or reset the password on the login page.
Running it again for an existing email only adds the missing memberships.

## Extension

```bash
bun install && bun run build -- --filter=extension   # → apps/extension/.output/chrome-mv3 (turbo builds capture-core first)
```

Zip `chrome-mv3` and share it together with `deploy/trybe/EXTENSION-INSTALL.md`. Unpacked extensions don't auto-update.
