#!/bin/bash
# Take one full backup (database + uploaded files) and push it off-site.
#
# Runs as a one-shot: the scheduler invokes it, and you can also run it by hand
#   docker compose run --rm backup /usr/local/bin/backup.sh
set -euo pipefail

DB_HOST="${DB_HOST:-db}"
DB_NAME="${DB_NAME:-al_malaki}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
STAGING_DIR="${BACKUP_STAGING_DIR:-/tmp/backups}"
UPLOADS_DIR="${BACKUP_UPLOADS_DIR:-/uploads}"

if [ -z "${DB_ROOT_PASSWORD:-}" ]; then
  echo "[backup] DB_ROOT_PASSWORD is required" >&2
  exit 1
fi

if [ -z "${RCLONE_REMOTE:-}" ]; then
  echo "[backup] RCLONE_REMOTE is required (e.g. r2:al-malaki-backups)" >&2
  exit 1
fi

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$STAGING_DIR"

database_archive="$STAGING_DIR/db-$timestamp.sql.gz"
uploads_archive="$STAGING_DIR/uploads-$timestamp.tar.gz"

# Remove partial artefacts if we fail partway through, so a later run never
# uploads a truncated archive.
cleanup() {
  rm -f "$database_archive" "$uploads_archive"
}
trap cleanup EXIT

echo "[backup] Dumping database '$DB_NAME' from '$DB_HOST'..."
# --single-transaction gives a consistent snapshot on InnoDB without locking
# tables, so the running app is never blocked by a backup.
MYSQL_PWD="$DB_ROOT_PASSWORD" mysqldump \
  --host="$DB_HOST" \
  --user=root \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --events \
  --databases "$DB_NAME" \
  | gzip -9 > "$database_archive"

echo "[backup] Database archive: $(du -h "$database_archive" | cut -f1)"

if [ -d "$UPLOADS_DIR" ]; then
  echo "[backup] Archiving uploaded files..."
  tar -czf "$uploads_archive" -C "$UPLOADS_DIR" .
  echo "[backup] Uploads archive: $(du -h "$uploads_archive" | cut -f1)"
else
  echo "[backup] No uploads directory at $UPLOADS_DIR, skipping"
  uploads_archive=""
fi

echo "[backup] Uploading to $RCLONE_REMOTE ..."
rclone copy "$database_archive" "$RCLONE_REMOTE/database/" --stats-one-line
if [ -n "$uploads_archive" ]; then
  rclone copy "$uploads_archive" "$RCLONE_REMOTE/uploads/" --stats-one-line
fi

echo "[backup] Verifying the uploaded database archive is readable..."
# A backup you have never read back is not a backup. Stream it from the remote
# and let gzip check its integrity.
rclone cat "$RCLONE_REMOTE/database/$(basename "$database_archive")" \
  | gzip -t

echo "[backup] Pruning remote copies older than ${RETENTION_DAYS} days..."
rclone delete "$RCLONE_REMOTE" --min-age "${RETENTION_DAYS}d"

echo "[backup] Done: $timestamp"
