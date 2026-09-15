#!/bin/bash
# Sleep until the next scheduled run, take a backup, repeat.
#
# A plain loop is used instead of cron so that backup output goes straight to
# the container logs, where Coolify (and `docker compose logs`) can show it.
set -euo pipefail

SCHEDULE_UTC="${BACKUP_SCHEDULE_UTC:-03:00}"

if ! echo "$SCHEDULE_UTC" | grep -Eq '^[0-2][0-9]:[0-5][0-9]$'; then
  echo "[backup] BACKUP_SCHEDULE_UTC must look like HH:MM, got '$SCHEDULE_UTC'" >&2
  exit 1
fi

if [ "${BACKUP_RUN_ON_START:-false}" = "true" ]; then
  echo "[backup] BACKUP_RUN_ON_START=true, taking an immediate backup"
  /usr/local/bin/backup.sh || echo "[backup] Startup backup failed" >&2
fi

while true; do
  now_epoch="$(date -u +%s)"
  next_epoch="$(date -u -d "today ${SCHEDULE_UTC}" +%s)"

  if [ "$next_epoch" -le "$now_epoch" ]; then
    next_epoch="$(date -u -d "tomorrow ${SCHEDULE_UTC}" +%s)"
  fi

  sleep_seconds=$((next_epoch - now_epoch))
  echo "[backup] Next run at ${SCHEDULE_UTC} UTC (in ${sleep_seconds}s)"
  sleep "$sleep_seconds"

  # Never let one bad night kill the scheduler: log and wait for tomorrow.
  /usr/local/bin/backup.sh || echo "[backup] Backup run failed" >&2
done
