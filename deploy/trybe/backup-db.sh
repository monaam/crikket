#!/usr/bin/env bash
# Trybe fork: nightly Postgres dump to the report bucket (backups/ prefix, 30-day lifecycle).
set -euo pipefail
cd "$(dirname "$0")/../.."
set -a; . ./.env; . apps/server/.env; set +a
FILE="crikket-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
docker exec crikket-postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "/tmp/$FILE"
docker run --rm -v /tmp:/tmp -e AWS_ACCESS_KEY_ID="$STORAGE_ACCESS_KEY_ID" \
  -e AWS_SECRET_ACCESS_KEY="$STORAGE_SECRET_ACCESS_KEY" -e AWS_DEFAULT_REGION="$STORAGE_REGION" \
  amazon/aws-cli s3 cp "/tmp/$FILE" "s3://${STORAGE_BUCKET}/backups/$FILE" --only-show-errors
rm -f "/tmp/$FILE"
echo "$(date -u +%FT%TZ) backed up $FILE"
