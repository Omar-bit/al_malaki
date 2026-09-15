# AL MALAKI — Deployment Guide (OVH VPS + DNS + Coolify)

End-to-end guide for running AL MALAKI in production: ordering and hardening an
OVH VPS, pointing a domain at it, installing Coolify, deploying the Docker stack,
and setting up off-site backups.

---

## Table of contents

1. [Architecture](#1-architecture)
2. [What is in the repository](#2-what-is-in-the-repository)
3. [Prerequisites](#3-prerequisites)
4. [Step 1 — Order and prepare the OVH VPS](#step-1--order-and-prepare-the-ovh-vps)
5. [Step 2 — Point your domain at the VPS (DNS)](#step-2--point-your-domain-at-the-vps-dns)
6. [Step 3 — Install Coolify](#step-3--install-coolify)
7. [Step 4 — Deploy the stack](#step-4--deploy-the-stack)
8. [Step 5 — Verify the deployment](#step-5--verify-the-deployment)
9. [Performance: multi-threaded backend](#9-performance-multi-threaded-backend)
10. [Uploads served by nginx](#10-uploads-served-by-nginx)
11. [Backups and restore](#11-backups-and-restore)
12. [Day-to-day operations](#12-day-to-day-operations)
13. [Troubleshooting](#13-troubleshooting)
14. [Production checklist](#14-production-checklist)

---

## 1. Architecture

The stack is deployed as a **single public origin**. nginx is the only container
exposed to the internet: it serves the React SPA, serves uploaded images straight
off disk, and reverse-proxies everything else under `/api` to the NestJS backend.

```
                        ┌──────────────────────────────────────────────┐
                        │            frontend (nginx :80)              │
  internet ──▶ Coolify ─▶  /                 → SPA static files        │
  (TLS via     (Traefik) │  /api/uploads/*    → uploads volume (direct) │
   Let's                 │  /api/*            → backend :3000           │
   Encrypt)              └───────────────────────┬──────────────────────┘
                                                 │
                             ┌───────────────────▼──────────────────┐
                             │ backend (NestJS, N worker processes) │
                             └──────┬───────────────┬───────────────┘
                                    │               │
                             ┌──────▼─────┐   ┌─────▼──────┐
                             │ db (MySQL) │   │   redis    │
                             └──────┬─────┘   └────────────┘
                                    │
                             ┌──────▼───────────────────────────────┐
                             │ backup → Cloudflare R2 (nightly)     │
                             └──────────────────────────────────────┘
```

Because the SPA and the API share one origin, **CORS is never exercised** and
auth cookies can stay `SameSite=Lax; Secure`.

### Why Redis is not optional in production

The backend runs several worker processes (see
[section 9](#9-performance-multi-threaded-backend)). Anything that used to be
safely held in one process's memory now has to be shared, and Redis is what
shares it:

| Concern | Without Redis | With Redis |
|---|---|---|
| SSE notifications / contact streams | An event created by worker A never reaches a browser connected to worker B | `RealtimeBusService` publishes to all workers |
| Rate limiting | Each worker counts separately, so the real limit is `N × limit` | Counters are global and exact |
| Response cache | Each worker caches independently | One shared cache |

All three degrade gracefully to in-process behaviour when `REDIS_URL` is unset,
which is correct for local development with a single worker — but in production
with multiple workers, **Redis must be reachable**.

---

## 2. What is in the repository

| File | Purpose |
|------|---------|
| `docker-compose.yml` | The full stack: `db`, `redis`, `backend`, `frontend`, `backup` |
| `.env.example` | Every environment variable, with notes on which are required |
| `server/Dockerfile` | Multi-stage NestJS build |
| `server/docker-entrypoint.sh` | Applies Prisma migrations, then boots the API |
| `server/src/cluster/cluster.ts` | Forks one API worker per CPU core |
| `server/src/realtime/realtime-bus.service.ts` | Cross-worker SSE fan-out over Redis |
| `server/src/common/throttler/redis-throttler.storage.ts` | Cross-worker rate limiting |
| `client/Dockerfile` | Vite build → nginx runtime |
| `client/nginx.conf` | SPA fallback, direct upload serving, `/api` proxy |
| `backup/Dockerfile` | `mysqldump` + `rclone` image |
| `backup/backup.sh` | One full backup (database + uploads) pushed off-site |
| `backup/restore.sh` | Restore the database from a remote archive |
| `backup/scheduler.sh` | Nightly scheduling loop |

---

## 3. Prerequisites

- A domain name (registered at OVH or anywhere else).
- An OVH account.
- An SSH key pair on your machine. Create one if you do not have it:
  ```bash
  ssh-keygen -t ed25519 -C "you@example.com"
  ```
- A Cloudflare account (free) for off-site backup storage.

### Sizing the VPS

| Users / traffic | vCPU | RAM | Disk | `WEB_CONCURRENCY` |
|---|---|---|---|---|
| Launch / low traffic | 2 | 4 GB | 40 GB | `2` |
| Growing store | 4 | 8 GB | 80 GB | `3`–`4` |
| Busy store | 8 | 16 GB | 160 GB | `6`–`8` |

**4 GB RAM is the practical minimum**, because the VPS runs MySQL, Redis, the API
workers, nginx, and Coolify itself. Each API worker is a full Node process using
roughly 100–150 MB, so do not set `WEB_CONCURRENCY` higher than the table above
without adding RAM. OVH plan names change over time — pick whichever current plan
meets the vCPU/RAM figures.

---

## Step 1 — Order and prepare the OVH VPS

### 1.1 Order

1. Go to the [OVHcloud VPS page](https://www.ovhcloud.com/en/vps/) and order a
   plan matching the sizing table above.
2. For the operating system choose **Ubuntu 24.04 LTS** (plain — *not* the
   "Docker" pre-installed image, since Coolify installs Docker itself).
3. Upload your **SSH public key** (`~/.ssh/id_ed25519.pub`) during checkout.
4. When provisioning finishes, OVH emails you the VPS IPv4 address. You can find
   it any time under **Bare Metal Cloud → Virtual Private Servers** in the OVH
   manager.

### 1.2 First login

```bash
ssh ubuntu@YOUR_VPS_IP
```

OVH's default user is usually `ubuntu` (sometimes `debian` or `root`, depending
on the image). Update the system:

```bash
sudo apt update && sudo apt upgrade -y
```

Reboot if a kernel update was installed:

```bash
sudo reboot
```

### 1.3 Create swap

MySQL and the Node workers occasionally spike. Swap turns a spike that would
trigger the out-of-memory killer into a brief slowdown:

```bash
sudo fallocate -l 2G /swapfile
```

```bash
sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
```

```bash
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Verify with `free -h`.

### 1.4 Firewall

Open only what is needed. Note that **port 8000 is the Coolify dashboard** —
restrict it to your own IP rather than the whole internet:

```bash
sudo ufw allow 22/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
```

```bash
sudo ufw allow from YOUR_HOME_IP to any port 8000 proto tcp
```

```bash
sudo ufw --force enable && sudo ufw status verbose
```

Find your current public IP by running `curl -4 ifconfig.me` on your own machine.
If your home IP is dynamic, leave 8000 closed entirely and reach the dashboard
through an SSH tunnel instead:

```bash
ssh -L 8000:localhost:8000 ubuntu@YOUR_VPS_IP
```

Then open `http://localhost:8000` in your browser.

### 1.5 Harden SSH

Disable password authentication so only your key works:

```bash
sudo sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
```

```bash
sudo sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
```

```bash
sudo systemctl restart ssh
```

> Keep your current SSH session open and confirm you can log in from a second
> terminal before closing it — otherwise a typo locks you out of the server.

Add fail2ban to throttle brute-force attempts:

```bash
sudo apt install -y fail2ban && sudo systemctl enable --now fail2ban
```

---

## Step 2 — Point your domain at the VPS (DNS)

You need two records, both pointing at the VPS IPv4 address.

| Type | Name | Value | TTL |
|------|------|-------|-----|
| `A` | `@` | `YOUR_VPS_IP` | 300 |
| `A` | `www` | `YOUR_VPS_IP` | 300 |

If OVH also gave you an IPv6 address, add matching `AAAA` records.

### If the domain is registered at OVH

1. OVH manager → **Web Cloud → Domain names → your domain → DNS zone**.
2. **Add an entry** → `A` → leave the subdomain blank for the root → enter the
   VPS IP → confirm.
3. Repeat with the subdomain `www`.
4. Delete any pre-existing `A` records pointing at OVH's parking page.

### If the domain is registered elsewhere

Add the same `A` records in that registrar's DNS panel.

### Verify propagation

From your own machine:

```bash
dig +short your-domain.com
```

```bash
dig +short www.your-domain.com
```

Both must print your VPS IP. A low TTL (300) keeps propagation to a few minutes.
**Do not continue to TLS until this resolves correctly** — Let's Encrypt validates
over HTTP and will fail if DNS is not yet pointing at the server.

---

## Step 3 — Install Coolify

Coolify is a self-hosted PaaS: it manages Docker, builds from Git, and issues
Let's Encrypt certificates through Traefik.

SSH into the VPS and run the official installer:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash
```

> This pipes a remote script into a root shell. Read it first if you prefer —
> `curl -fsSL https://cdn.coollabs.io/coolify/install.sh | less` — and check the
> current instructions at [coolify.io/docs](https://coolify.io/docs) in case the
> install command has changed.

Installation takes a few minutes (it installs Docker and starts Coolify's own
containers). When it finishes, open:

```
http://YOUR_VPS_IP:8000
```

Create the admin account **immediately** — the first person to load that page
claims the instance. Then, in the dashboard:

1. **Settings → Instance Domain**: set a domain for Coolify itself
   (e.g. `coolify.your-domain.com`, with its own `A` record) so the dashboard is
   served over HTTPS instead of a bare IP.
2. Confirm the default **localhost** server shows as reachable under **Servers**.

---

## Step 4 — Deploy the stack

### 4.1 Create the resource

1. **Projects → New Project** → name it `al-malaki`.
2. Inside the project: **New Resource → Docker Compose**.
3. Choose the source:
   - **Public Repository**: paste the repository URL.
   - **GitHub App / Private Repository**: connect the GitHub integration first
     (**Settings → Sources**), then pick the repository. This also enables
     automatic redeploys on push.
4. Set **Branch** to `main` and **Docker Compose Location** to
   `/docker-compose.yml`.

### 4.2 Environment variables

Open the resource's **Environment Variables** tab and paste the contents of
`.env.example`, replacing every placeholder. The values that have no safe
default:

| Variable | Notes |
|---|---|
| `DB_PASSWORD` | Strong random string |
| `DB_ROOT_PASSWORD` | Strong random string, different from the above |
| `JWT_ACCESS_SECRET` | **≥ 32 random characters.** The app refuses to start in production with a short or example value |
| `CLIENT_ORIGIN` | `https://your-domain.com` |
| `ADMIN_INVITE_URL_BASE` | `https://your-domain.com/invite/accept` |
| `SMTP_*` | Your mail provider's credentials |
| `DEFAULT_ADMIN_EMAIL` / `DEFAULT_ADMIN_PASSWORD` | Seeded on first boot — change the password after logging in |

Generate strong secrets with:

```bash
openssl rand -base64 36
```

Leave `VITE_API_BASE_URL=/api`, `API_URL=/api`, and `COOKIE_SECURE=true` as they
are for this single-origin deployment. `API_URL` is the base the backend puts in
the image URLs it returns, so it must match `VITE_API_BASE_URL`.

### 4.3 Attach the domain

In the resource's **Configuration**, attach the domain to the **`frontend`
service only**, on container port **80**:

```
https://your-domain.com
```

Do **not** expose `backend`, `db`, `redis`, or `backup` — they are reachable on
the internal Docker network and must stay off the public internet.

Enable **Generate SSL Certificate** (Let's Encrypt) and, if offered,
**Redirect HTTP → HTTPS**.

### 4.4 Persistent storage

The compose file declares three named volumes, which Coolify preserves across
redeploys:

| Volume | Contents | Losing it means |
|---|---|---|
| `db_data` | MySQL data | Total data loss |
| `uploads_data` | Product / category / profile images | All uploaded images gone |
| `redis_data` | Cache + realtime | Harmless — rebuilt automatically |

Never choose "delete volumes" when redeploying unless you intend to wipe the
store.

### 4.5 Deploy

Press **Deploy** and watch the logs. On the first run the stack will:

1. Build the backend and frontend images (several minutes).
2. Start MySQL and Redis, waiting for both healthchecks.
3. Run `prisma migrate deploy` to create the schema.
4. Seed the default admin from `DEFAULT_ADMIN_*`.
5. Fork the API workers and start serving.

---

## Step 5 — Verify the deployment

Run these from your own machine unless noted otherwise.

**The site loads over HTTPS with a valid certificate:**

```bash
curl -I https://your-domain.com
```

**The API responds through the proxy:**

```bash
curl -i https://your-domain.com/api/health
```

**Multiple workers are running** — SSH to the VPS and run:

```bash
docker compose logs backend | grep -iE "starting .* workers|listening on port"
```

You should see one `Worker <pid> listening on port 3000` line per worker, plus a
`Primary <pid> starting N workers` line.

**Uploads are served by nginx, not Node.** Upload a product image in the admin
UI, then request it:

```bash
curl -I https://your-domain.com/api/uploads/products/FILENAME.jpg
```

Expect `Server: nginx` and
`Cache-Control: public, max-age=31536000, immutable`.

**Realtime notifications work across workers.** Open the admin dashboard in one
browser and place an order as a customer in another — the notification should
appear without a refresh. If it appears only sometimes, Redis is not reachable;
see [Troubleshooting](#13-troubleshooting).

Finally, log in as `DEFAULT_ADMIN_EMAIL` and **change the password**.

---

## 9. Performance: multi-threaded backend

### The problem

Node.js executes JavaScript on a single thread. One backend process can therefore
only ever use **one CPU core**, no matter how many the VPS has. On a 4-core VPS,
three quarters of the CPU sat idle while requests queued behind whatever that one
thread was doing.

### The solution

On startup the backend forks one worker process per available core
(`server/src/cluster/cluster.ts`). All workers share the same listening socket
and the OS distributes incoming connections between them, so the API scales
across every core. If a worker crashes, the primary process replaces it
immediately.

`availableParallelism()` is used rather than the raw CPU count, because it
respects the container's CPU limit instead of reporting the whole host.

### Configuration

| Variable | Default | Meaning |
|---|---|---|
| `WEB_CONCURRENCY` | every available core | Number of API worker processes |
| `DB_CONNECTION_LIMIT` | `5` | Database connections **per worker** |

Set `WEB_CONCURRENCY=1` to disable clustering entirely (the app then runs exactly
as it did before).

### Sizing the connection pool

Total connections to MySQL are `WEB_CONCURRENCY × DB_CONNECTION_LIMIT`, and MySQL
allows 151 by default. With the defaults, an 8-core VPS opens `8 × 5 = 40` — well
within budget. If you raise either value, keep the product below roughly 120, or
raise MySQL's `max_connections` to match.

### What had to change for this to be correct

Forking processes silently breaks anything kept in a single process's memory.
Three things were moved to Redis so the cluster behaves like one logical server:

- **SSE fan-out** (`RealtimeBusService`) — notification and contact-message
  streams are published over Redis pub/sub, so an event raised by any worker
  reaches subscribers connected to every worker.
- **Rate limiting** (`RedisThrottlerStorage`) — counters live in Redis and are
  incremented with an atomic Lua script, so "120 requests/minute/IP" stays exact
  regardless of worker count.
- **Startup seeding** — only worker 1 seeds the default admin, so workers do not
  race to create the same row.

---

## 10. Uploads served by nginx

Previously every product image was read from disk and streamed by a Node worker
through `ServeStaticModule`. That is the least valuable possible use of an
application thread: it occupies a worker that could be handling API requests.

Now the `uploads_data` volume is mounted **read-only** into the nginx container
at `/var/www/uploads`, and nginx serves those files directly:

```nginx
location /api/uploads/ {
  alias /var/www/uploads/;
  try_files $uri =404;
  ...
}
```

nginx matches the longest prefix first, so `/api/uploads/...` is served straight
from disk while every other `/api/...` path is still proxied to the backend.
Uploads never touch Node.

Because filenames are server-generated UUIDs that are never reused, responses are
marked `immutable` with a one-year cache lifetime, so repeat visitors stop
re-requesting images entirely.

### Image URLs

The backend builds image URLs from `API_URL`, which is set to `/api` in
`docker-compose.yml`. That keeps every image same-origin and pointed at the path
nginx serves directly:

```
https://your-domain.com/api/uploads/products/<uuid>.jpg
```

Keep `API_URL` and `VITE_API_BASE_URL` identical. If you ever move the API to its
own domain, both must change together, or images will 404.

**Uploading** still goes through the backend (`POST /api/products/images`), which
validates the MIME type, rewrites the filename, and enforces a 5 MB limit. Only
*serving* moved to nginx.

Safety headers are set on served uploads (`X-Content-Type-Options: nosniff`,
`Content-Disposition: inline`, and a pinned `types` map) so a user-supplied file
can never be interpreted as an active document.

**Local development is unaffected**: `SERVE_UPLOADS_FROM_APP` defaults to `true`
outside production, so running the API without nginx still serves `/uploads`.

---

## 11. Backups and restore

The `backup` service takes a nightly snapshot of **both** the database and the
uploaded files, and pushes them off the VPS. A backup that lives only on the
machine it is protecting is not a backup.

### Why Cloudflare R2

The free tier includes **10 GB of storage with no egress fees**, it is
S3-compatible, and it is not an AWS service. Anything rclone supports works just
as well — see [alternative destinations](#alternative-destinations) below.

### 11.1 Create the bucket

1. Sign in to the [Cloudflare dashboard](https://dash.cloudflare.com) → **R2**.
2. **Create bucket** → name it `al-malaki-backups` → choose a location near your
   VPS → create. Keep it **private**.
3. **Manage R2 API Tokens → Create API token**:
   - Permission: **Object Read & Write**
   - Scope it to the `al-malaki-backups` bucket only
   - Create, then copy the **Access Key ID**, **Secret Access Key**, and the
     **endpoint** (`https://<account-id>.r2.cloudflarestorage.com`). The secret
     is shown only once.

### 11.2 Configure

Add these to your Coolify environment variables:

```env
RCLONE_REMOTE=r2:al-malaki-backups
BACKUP_SCHEDULE_UTC=03:00
BACKUP_RETENTION_DAYS=14
BACKUP_RUN_ON_START=true

RCLONE_CONFIG_R2_TYPE=s3
RCLONE_CONFIG_R2_PROVIDER=Cloudflare
RCLONE_CONFIG_R2_ACCESS_KEY_ID=<your access key id>
RCLONE_CONFIG_R2_SECRET_ACCESS_KEY=<your secret access key>
RCLONE_CONFIG_R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
RCLONE_CONFIG_R2_ACL=private
```

rclone is configured entirely through `RCLONE_CONFIG_*` variables, so no config
file has to be mounted. Setting `BACKUP_RUN_ON_START=true` for the first deploy
proves the credentials work right away; set it back to `false` afterwards.

Redeploy, then check the logs on the VPS:

```bash
docker compose logs -f backup
```

A successful run looks like:

```
[backup] Dumping database 'al_malaki' from 'db'...
[backup] Database archive: 2.4M
[backup] Archiving uploaded files...
[backup] Uploads archive: 48M
[backup] Uploading to r2:al-malaki-backups ...
[backup] Verifying the uploaded database archive is readable...
[backup] Pruning remote copies older than 14 days...
[backup] Done: 20260819T030000Z
[backup] Next run at 03:00 UTC (in 86400s)
```

### 11.3 What it does

Each night at `BACKUP_SCHEDULE_UTC` the service:

1. Runs `mysqldump --single-transaction`, which takes a consistent InnoDB
   snapshot **without locking tables**, so the live store is never blocked.
2. Compresses the dump to `database/db-<timestamp>.sql.gz`.
3. Archives the uploads volume to `uploads/uploads-<timestamp>.tar.gz`.
4. Uploads both to R2.
5. **Reads the database archive back from R2 and tests its integrity** — an
   unverified upload is not proof of a working backup.
6. Deletes remote copies older than `BACKUP_RETENTION_DAYS`.

Timestamps are UTC, so archive names sort chronologically.

### 11.4 Run a backup by hand

```bash
docker compose run --rm backup /usr/local/bin/backup.sh
```

### 11.5 Restore

> Restoring **overwrites** the current database. Stop the backend first so
> nothing writes during the restore.

See what is available:

```bash
docker compose run --rm backup rclone lsf r2:al-malaki-backups/database/
```

Stop the app, leaving the database running:

```bash
docker compose stop backend
```

Restore the most recent backup:

```bash
docker compose run --rm backup /usr/local/bin/restore.sh
```

Or restore a specific one:

```bash
docker compose run --rm backup /usr/local/bin/restore.sh db-20260819T030000Z.sql.gz
```

Bring the app back:

```bash
docker compose start backend
```

To restore uploaded images, first change `uploads_data:/uploads:ro` to
`uploads_data:/uploads` under the `backup` service in `docker-compose.yml` (it is
mounted read-only by default), then run:

```bash
docker compose run --rm --entrypoint sh backup -c 'rclone cat r2:al-malaki-backups/uploads/uploads-TIMESTAMP.tar.gz | tar -xzf - -C /uploads'
```

Change the mount back to `:ro` afterwards.

**Test your restore at least once**, against a throwaway database, before you
ever need it.

### Alternative destinations

Any rclone remote works — only `RCLONE_REMOTE` and the `RCLONE_CONFIG_*` block
change:

| Destination | Free tier | rclone type |
|---|---|---|
| **Cloudflare R2** | 10 GB, no egress fees | `s3` (provider `Cloudflare`) |
| **Backblaze B2** | 10 GB | `b2` |
| **Google Drive** | 15 GB (shared with Gmail) | `drive` |
| **Storj** | 25 GB | `s3` (provider `Storj`) |

---

## 12. Day-to-day operations

All commands run on the VPS, from the deployment directory Coolify created (find
it under the resource's **Configuration → Storage**, typically
`/data/coolify/applications/<uuid>`).

**Follow the logs:**

```bash
docker compose logs -f backend
```

**Redeploy:** push to `main` (auto-deploys if the GitHub integration is
connected), or press **Redeploy** in Coolify.

**Database migrations** run automatically on every boot via
`server/docker-entrypoint.sh` (`prisma migrate deploy`). Nothing manual is
needed — just commit the migration.

**Open a database shell:**

```bash
docker compose exec db mysql -u root -p al_malaki
```

**Change the worker count:** set `WEB_CONCURRENCY` in Coolify and redeploy.

**Watch resource usage:**

```bash
docker stats
```

**Free disk space** (old images accumulate after many deploys):

```bash
docker image prune -a -f
```

---

## 13. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Let's Encrypt certificate fails | DNS not yet pointing at the VPS, or port 80 blocked | Check `dig +short your-domain.com`; confirm `ufw allow 80/tcp` |
| Backend restarts in a loop | `JWT_ACCESS_SECRET` too short, or a required variable missing | `docker compose logs backend` — Joi prints exactly which variable failed |
| Backend cannot reach the database | MySQL still starting | The healthcheck handles this; if it persists, confirm `DB_PASSWORD` matches in both services |
| Notifications appear only sometimes | Redis unreachable, so workers cannot share events | Check the backend logs for a "falling back to in-memory" warning |
| Rate limit seems roughly N× too permissive | Same cause as above | Fix Redis connectivity |
| Images return 404 | The uploads volume is not mounted into nginx | Confirm `uploads_data:/var/www/uploads:ro` under `frontend` |
| Images point at `localhost:3000` | `API_URL` not set | Set `API_URL=/api` and redeploy |
| Images 404 only after a redeploy | The volume was deleted | Restore from backup; never delete volumes on redeploy |
| Upload fails with `413` | File larger than the nginx cap | Raise `client_max_body_size` in `client/nginx.conf` (and the 5 MB limit in `upload-storage.ts`) |
| `Too many connections` from MySQL | `WEB_CONCURRENCY × DB_CONNECTION_LIMIT` exceeds `max_connections` | Lower either value |
| Out-of-memory kills | Too many workers for the available RAM | Lower `WEB_CONCURRENCY`; confirm swap is active with `free -h` |
| Backup logs an rclone auth error | Wrong key, endpoint, or bucket name | Re-check the `RCLONE_CONFIG_R2_*` values; the endpoint must include your account id |

---

## 14. Production checklist

Before announcing the site:

- [ ] `JWT_ACCESS_SECRET` is ≥ 32 random characters and not the example value
- [ ] `DB_PASSWORD` and `DB_ROOT_PASSWORD` are strong and different
- [ ] The default admin password has been changed after first login
- [ ] HTTPS works and HTTP redirects to it
- [ ] `COOKIE_SECURE=true` and `CLIENT_ORIGIN` is the real domain
- [ ] `API_URL` and `VITE_API_BASE_URL` are both `/api`
- [ ] Only the `frontend` service has a public domain attached
- [ ] UFW is enabled; port 8000 is restricted to your IP or closed
- [ ] SSH password authentication is disabled
- [ ] Swap is active
- [ ] Multiple workers are visible in the backend logs
- [ ] An upload returns `Server: nginx` with a long `Cache-Control`
- [ ] A backup has completed successfully and been verified
- [ ] A restore has been rehearsed at least once
- [ ] SMTP works (register a test account and receive the OTP)

---

## Running locally with plain Docker

```bash
cp .env.example .env
```

Edit the required values, then:

```bash
docker compose up --build -d
```

The frontend publishes container port 80 on an ephemeral host port; set an
explicit mapping (e.g. `"8080:80"` under `frontend.ports`) for a fixed local
port. The `backup` service will log a configuration error and restart unless
`RCLONE_REMOTE` is set — harmless locally, or comment the service out.
