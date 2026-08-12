# Deployment (Docker + Coolify)

The app is containerized as a single-origin stack: the **frontend** (nginx) serves
the React SPA and reverse-proxies `/api/*` to the **backend** (NestJS), which talks
to **MySQL** and **Redis**. Only the frontend is exposed publicly.

```
              ┌──────────── frontend (nginx :80) ─────────────┐
  internet ──▶│  /            → SPA static files              │
  (via Coolify│  /api/*       → backend :3000 (prefix stripped)│
   TLS proxy) │  /api/uploads → backend static uploads         │
              └───────────────────┬───────────────────────────┘
                                   │
                     backend (NestJS :3000) ──▶ db (MySQL), redis
```

## Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Full stack: db (MySQL 8), redis, backend, frontend |
| `server/Dockerfile` | Multi-stage NestJS build; runs `prisma migrate deploy` on start |
| `server/docker-entrypoint.sh` | Applies DB migrations, then boots the server |
| `client/Dockerfile` | Vite build → nginx |
| `client/nginx.conf` | SPA fallback + `/api` reverse proxy (SSE-aware) |
| `.env.example` | All environment variables (copy to `.env` / paste into Coolify) |

## Deploy on Coolify

1. **New Resource → Docker Compose**, point it at this repo (compose file at root).
2. Add environment variables from `.env.example`. At minimum set the REQUIRED ones:
   `DB_PASSWORD`, `DB_ROOT_PASSWORD`, `JWT_ACCESS_SECRET` (strong, ≥16 chars),
   `CLIENT_ORIGIN` (your domain), plus SMTP + `DEFAULT_ADMIN_*`.
3. Attach your domain to the **frontend** service, container port **80**. Coolify
   terminates TLS and proxies to it.
4. Deploy. On first boot the backend applies all migrations and seeds the default
   admin (`DEFAULT_ADMIN_EMAIL` / `DEFAULT_ADMIN_PASSWORD`).

Persistent data lives in named volumes: `db_data`, `redis_data`, `uploads_data`
(uploaded product/category/profile images). Keep these across redeploys.

## Run locally (plain Docker)

```bash
cp .env.example .env   # then edit the REQUIRED values
docker compose up --build -d
```

The frontend publishes container port 80 on an ephemeral host port; set an explicit
mapping (e.g. `"8080:80"` under `frontend.ports`) if you want a fixed local port.

## Notes

- **Same-origin, no CORS.** The SPA calls the API at `/api` (same host), so cookies
  are `SameSite=Lax` and CORS is never exercised. To instead run the API on a
  separate domain, set the `VITE_API_BASE_URL` build arg to that URL and configure
  `CLIENT_ORIGIN` + `COOKIE_SAMESITE=none`.
- **External managed database?** Drop the `db` service dependency and point
  `DATABASE_URL` at your managed MySQL instead of the compose default.
- **Uploads under 15 MB** — the nginx `client_max_body_size` cap. Raise it in
  `client/nginx.conf` if you need larger image uploads.
```
