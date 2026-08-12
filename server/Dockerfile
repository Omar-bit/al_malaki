# syntax=docker/dockerfile:1

# ---------- Build stage ----------
# Debian slim (not Alpine) keeps Prisma's migration engine happy — it needs
# system OpenSSL, which musl-based Alpine handles poorly.
FROM node:22-bookworm-slim AS build

WORKDIR /app

# OpenSSL is required by the Prisma schema/migration engine.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies first for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the Prisma schema/config before generating the client.
COPY prisma.config.ts ./
COPY prisma ./prisma

# Copy the rest of the source and build.
# `npm run build` runs the `prebuild` hook (prisma generate) then `nest build`,
# which also copies the generated client into dist/src via nest-cli assets.
COPY . .
RUN npm run build

# ---------- Runtime stage ----------
FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Bring over the fully-installed node_modules (includes the Prisma CLI used for
# `migrate deploy` at startup and the generated client), the compiled output,
# and the schema/migrations needed to apply migrations.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/package.json ./package.json

# Uploaded images live here and are mounted as a persistent volume in compose.
RUN mkdir -p uploads

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
