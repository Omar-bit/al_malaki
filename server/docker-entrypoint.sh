#!/bin/sh
set -e

# Apply any pending database migrations before starting the app. `migrate deploy`
# is the production-safe command: it only applies committed migrations and never
# generates or resets. The default admin user is seeded by the app on bootstrap.
echo "[entrypoint] Applying database migrations..."
node_modules/.bin/prisma migrate deploy

echo "[entrypoint] Starting server..."
exec node dist/src/main
