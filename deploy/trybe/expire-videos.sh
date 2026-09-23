#!/usr/bin/env bash
# Trybe fork: delete report videos (…/capture/video.webm) older than RETENTION_DAYS.
# S3 lifecycle rules can't filter by key suffix, so this runs daily from cron.
# Report rows, screenshots and debugger payloads are kept.
set -euo pipefail

cd "$(dirname "$0")/../.."
RETENTION_DAYS="${RETENTION_DAYS:-90}"
set -a; . apps/server/.env; set +a

CUTOFF="$(date -u -d "-${RETENTION_DAYS} days" +%Y-%m-%dT%H:%M:%SZ)"

aws() {
  docker run --rm -e AWS_ACCESS_KEY_ID="$STORAGE_ACCESS_KEY_ID" \
    -e AWS_SECRET_ACCESS_KEY="$STORAGE_SECRET_ACCESS_KEY" \
    -e AWS_DEFAULT_REGION="$STORAGE_REGION" amazon/aws-cli "$@"
}

aws s3api list-objects-v2 --bucket "$STORAGE_BUCKET" --prefix organizations/ \
  --query "Contents[?ends_with(Key, '/capture/video.webm') && LastModified<'${CUTOFF}'].Key" \
  --output text | tr '\t' '\n' | { grep -v -e '^None$' -e '^$' || true; } | while read -r key; do
    aws s3api delete-object --bucket "$STORAGE_BUCKET" --key "$key" >/dev/null
    echo "$(date -u +%FT%TZ) deleted s3://${STORAGE_BUCKET}/${key}"
  done
