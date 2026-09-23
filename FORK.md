# Trybe fork of Crikket

Self-hosted at **https://feedback.thetrybe.xyz**. Branch `trybe` = upstream `master` + the patches below.
Upstream: https://github.com/redpangilinan/crikket (AGPL-3.0 — this fork stays public).

## Patches carried

| # | Files | Why |
|---|-------|-----|
| 1 | `packages/auth/src/lib/email/send-auth-email.ts`, `packages/env/src/server.ts`, `apps/server/.env.example` | Email goes through Postmark (`POST https://api.postmarkapp.com/email`) instead of Resend. Env: `POSTMARK_SERVER_TOKEN`, `POSTMARK_FROM_EMAIL`, `POSTMARK_FROM_NAME`, `POSTMARK_MESSAGE_STREAM`. Still throws in production when unconfigured. |
| 2 | `packages/env/src/server.ts` | `ENABLE_PAYMENTS` defaults to `false` (upstream: `true`, which puts every org on the `free` plan = no reports). Prod `.env` also sets it explicitly. |
| 3 | `apps/extension/.env.production`, `apps/extension/wxt.config.ts` | Extension builds target feedback.thetrybe.xyz; manifest `key` pins the extension ID to `jpclpbgghajgfmgnahclacibedmhhpfp` (allowed in the S3 bucket CORS). |
| 4 | `packages/auth/scripts/create-user.ts` | Signups are closed (`ALLOWED_SIGNUP_DOMAINS=signup-disabled.invalid`), which blocks better-auth user creation incl. the admin plugin. This script inserts users directly. |
| 8 | `apps/extension/components/screenshot-annotation-editor.tsx`, `apps/extension/lib/screenshot-annotations.ts`, `apps/extension/components/form-step.tsx`, `apps/extension/entrypoints/recorder/App.tsx` | Screenshot annotation (draw / highlight / rectangle, 4 colours, undo/clear) plus a **Crop** tool in the extension review step, ported/extended from the embed SDK (`sdks/capture`); the edited PNG replaces the original on upload. If upstream adds annotation to the extension, drop this patch. |
| 9 | `apps/extension/lib/area-screenshot.ts`, `entrypoints/background.ts`, `hooks/use-popup-capture.ts`, `hooks/use-recorder-init.ts`, `lib/bug-report-debugger/engine/background/{index,session-store}.ts` | Area-selection screenshots: the popup hands off to the background (it closes when the page gets focus), which injects a drag-to-select overlay, captures the visible tab, and the recorder crops to the selection. Click = whole visible page, Esc = cancel; pages that block injection fall back to the whole tab. `registerDebuggerBackgroundListeners` returns its store so the background can start the debugger session after the selection. |
| 7 | `packages/auth/src/index.ts`, `packages/auth/src/lib/invited-signup.ts`, `apps/web/src/app/(protected)/onboarding/layout.tsx` | Invite-only sign-up: an email with a pending, unexpired invitation may sign up; its invitations are accepted once the email is verified (sign-up OTP). Unverified users are sent to `/verify-email` instead of the create-org onboarding. |
| 5 | `docker-compose.trybe.yml`, `deploy/trybe/*` | Build images from the fork, bind Postgres/app ports to localhost, video expiry + DB backup cron scripts, Caddy serving the extension guide at `/extension/`. |
| 6 | `packages/auth/src/lib/email/auth-emails.tsx`, `templates/welcome-template.tsx`, `templates/organization-invitation-template.tsx` | Welcome email sent by `create-user.ts` (install guide + "Forgot password?" to set a password); invitation emails link the install guide. |

## Updating from upstream

```bash
git fetch upstream
git checkout trybe
git rebase upstream/master          # conflicts only expected in the files above
# Re-check after rebase:
grep -rn "resend\|RESEND_" packages apps --include=*.ts   # new Resend call sites need the Postmark path
grep -n "ENABLE_PAYMENTS" -A3 packages/env/src/server.ts   # default must still be "false"
grep -n "databaseHooks" -A35 packages/auth/src/index.ts   # invite-only signup hooks (create.before/after, update.after) intact?
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

If `deploy/trybe/Caddyfile` changed: `docker exec crikket-caddy caddy reload --config /etc/caddy/trybe/Caddyfile`.
Guide/zip changes under `deploy/trybe/extension-site/` are live as soon as they're pulled.

Cron (`crontab -l` as ubuntu):

- `deploy/trybe/expire-videos.sh` daily: deletes `…/capture/video.webm` older than 90 days (S3 lifecycle can't match on key suffix).
- `deploy/trybe/backup-db.sh` nightly: `pg_dump` → `s3://trybe-crikket-feedback/backups/` (30-day lifecycle).

## Accounts

Preferred: invite people from the dashboard (Settings → Members). They click **Sign up** with the invited address,
verify the emailed code, and join the organisation automatically. Invitations expire after 48 hours (better-auth default); re-invite if needed.

Alternative, for accounts without an invitation:

Create users and add them to organisations (org slugs are shown in Settings):

```bash
cd ~/crikket
docker compose -f docker-compose.yml -f docker-compose.caddy.yml -f docker-compose.trybe.yml exec server \
  bun packages/auth/scripts/create-user.ts --email jane@thetrybe.xyz --name "Jane Doe" --org fatoura --org trybe:admin
```

New users get a welcome email with the install guide and a link to set their password via "Forgot password?" (the login page has no email-code sign-in).
Pass `--no-email` to skip it. Running it again for an existing email only adds the missing memberships (no email).

## Extension

```bash
bun install && bun run build -- --filter=extension   # → apps/extension/.output/chrome-mv3 (turbo builds capture-core first)
```

Then `cd apps/extension/.output && zip -r ../../../deploy/trybe/extension-site/crikket-extension.zip chrome-mv3`, commit, and `git pull` on the server:
the guide at https://feedback.thetrybe.xyz/extension/ serves that zip. Unpacked extensions don't auto-update, so tell everyone to re-download and reload.
