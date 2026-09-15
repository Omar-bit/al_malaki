#!/bin/bash
# Restore the database from a backup archive stored on the remote.
#
#   docker compose run --rm backup /usr/local/bin/restore.sh              # latest
#   docker compose run --rm backup /usr/local/bin/restore.sh db-2026...gz # specific
#
# This OVERWRITES the current contents of the target database. Stop the backend
# first so nothing writes while the restore runs.
set -euo pipefail

DB_HOST="${DB_HOST:-db}"
DB_NAME="${DB_NAME:-al_malaki}"
requested_archive="${1:-}"

if [ -z "${DB_ROOT_PASSWORD:-}" ]; then
  echo "[restore] DB_ROOT_PASSWORD is required" >&2
  exit 1
fi

if [ -z "${RCLONE_REMOTE:-}" ]; then
  echo "[restore] RCLONE_REMOTE is required" >&2
  exit 1
fi

if [ -z "$requested_archive" ]; then
  echo "[restore] No archive given, selecting the most recent one..."
  # Archive names are UTC timestamps, so a lexical sort is a chronological sort.
  requested_archive="$(rclone lsf "$RCLONE_REMOTE/database/" | sort | tail -n 1)"
fi

if [ -z "$requested_archive" ]; then
  echo "[restore] No backups found at $RCLONE_REMOTE/database/" >&2
  exit 1
fi

echo "[restore] Restoring '$requested_archive' into database '$DB_NAME' on '$DB_HOST'"
echo "[restore] This overwrites existing data. Starting in 5s, Ctrl-C to abort."
sleep 5

# Stream straight from the remote into mysql: no need for disk space equal to
# the dump, and gunzip fails loudly if the archive is corrupt.
rclone cat "$RCLONE_REMOTE/database/$requested_archive" \
  | gunzip \
  | MYSQL_PWD="$DB_ROOT_PASSWORD" mysql --host="$DB_HOST" --user=root

echo "[restore] Done. Restart the backend to pick up the restored data."
