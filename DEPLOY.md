# Deploy mysimoka.id

Static site served by `nginx-unprivileged` in a container. Same model as SHD-Finance-Flow on
this server: CI builds the image and publishes it to GHCR; the server pulls it itself via
`deploy/deploy.sh` from cron. GitHub holds no credentials for the server.

## Map

| What | Value |
|------|-------|
| Host | `103.193.178.249`, user `rentalize` |
| Repo clone | `/home/rentalize/mysimoka-web` (stack in `deploy/`, `.env` there) |
| Image | `ghcr.io/faridsurya-dev/mysimoka-web:<commit sha>` (private package) |
| Container | `mysimoka-web` (compose project `mysimoka`), port `8080`, no host port |
| Reverse proxy | `nginx` container on network `nginx_net`, owns 80/443 |
| Vhost | `/home/rentalize/app/nginx/conf.d/mysimoka.id.conf` (source: `deploy/mysimoka.id.conf`) |
| Certificates | `/home/rentalize/app/nginx/letsencrypt` → `/etc/letsencrypt` in `nginx` |
| DNS | idwebhost: `mysimoka.id` A + wildcard `*` A → `103.193.178.249` |

nginx reaches the app by container name over `nginx_net`, resolved per request, so a deploy
never needs an nginx reload.

## 1. Read token for GHCR

Push to `main`; the `CI` workflow publishes `ghcr.io/faridsurya-dev/mysimoka-web:<sha>` and
`:main` as a private package.

Create a **classic** PAT (GHCR does not accept fine-grained tokens): GitHub → Settings →
Developer settings → Personal access tokens → Tokens (classic) → scope **`read:packages`**
only, with an expiry you will track.

The token must **not** go into `~/.docker/config.json`. That file keeps one credential per
registry, and its `ghcr.io` slot belongs to SHD-Finance-Flow's auto-deploy; a `docker login
ghcr.io` there silently replaces SHD's token and breaks its deploys. `deploy.sh` therefore
uses its own config dir, `deploy/.docker` (git-ignored, mode 700).

## 2. Server setup (once)

```bash
cd /home/rentalize
git clone https://github.com/faridsurya-dev/mysimoka-web.git
cd mysimoka-web/deploy
cp .env.example .env
mkdir -m 700 .docker

# paste the token when prompted, then Ctrl-D; it never lands in shell history
DOCKER_CONFIG=$PWD/.docker docker login ghcr.io -u faridsurya-dev --password-stdin

./deploy.sh --force        # first run: the fresh clone is already at origin/main
```

When the token expires, cron logs `ghcr.io refused the pull`; repeat the `docker login` line
with a new token.

Check:
```bash
docker ps --filter name=mysimoka-web          # (healthy)
docker run --rm --network nginx_net busybox wget -qO- http://mysimoka-web:8080/healthz   # ok
```

## 3. Auto-deploy (cron)

```bash
crontab -e
*/2 * * * * /home/rentalize/mysimoka-web/deploy/deploy.sh >> /home/rentalize/log/mysimoka-deploy.log 2>&1
```

`deploy.sh` exits silently when there is no new commit. On a new commit it pulls the image for
that exact SHA (retrying next run if CI has not pushed it yet), fast-forwards the clone,
`up -d`, waits until the container is healthy, then removes this app's older images only.

## 4. Vhost + TLS (on the server, once)

Other domains here use certbot `standalone`, which stops nginx (every site) while it runs.
`mysimoka.id` uses `webroot` instead: challenge files go into
`/home/rentalize/app/nginx/letsencrypt/webroot`, which nginx already sees as
`/etc/letsencrypt/webroot`. nginx refuses to load a vhost whose certificate is missing, so
issue the certificate before enabling the 443 blocks.

```bash
cd /home/rentalize/app/nginx
mkdir -p letsencrypt/webroot

# 4a) HTTP-only vhost that answers the ACME challenge
cat > conf.d/mysimoka.id.conf <<'CONF'
server {
    listen 80;
    listen [::]:80;
    server_name mysimoka.id www.mysimoka.id;
    location /.well-known/acme-challenge/ { root /etc/letsencrypt/webroot; }
    location / { return 404; }
}
CONF
docker exec nginx nginx -t && docker exec nginx nginx -s reload

# 4b) issue the certificate
docker run --rm \
  -v /home/rentalize/app/nginx/letsencrypt:/etc/letsencrypt \
  -v /home/rentalize/log/letsencrypt:/var/log/letsencrypt \
  certbot/certbot:latest certonly --webroot -w /etc/letsencrypt/webroot \
  --cert-name mysimoka.id -d mysimoka.id -d www.mysimoka.id \
  --email <admin-email> --agree-tos --no-eff-email
```

4c) Replace the temporary vhost with the full one from the clone, then reload:
```bash
cp /home/rentalize/mysimoka-web/deploy/mysimoka.id.conf /home/rentalize/app/nginx/conf.d/mysimoka.id.conf
docker exec nginx nginx -t && docker exec nginx nginx -s reload
```
The vhost is copied, not symlinked: a later `git pull` must never change live nginx config
without a `nginx -t`.

Check: `curl -I https://mysimoka.id` → `200`, `curl -I http://www.mysimoka.id` → `301`.

## 5. Renewal

Do **not** add `mysimoka.id` to `STANDALONE` in `/usr/local/bin/renew-rentalize-cert.sh`: that
loop renews while nginx is stopped, and a webroot challenge needs nginx running. Add this block
right after "Fase 1" instead:

```bash
# --- Fase 1b: webroot. Tanpa downtime, nginx tetap melayani tantangan HTTP-01. ---
for cert in mysimoka.id; do
  docker run --rm \
    -v "$LE_DIR:/etc/letsencrypt" \
    -v "$LOG_DIR:/var/log/letsencrypt" \
    certbot/certbot:latest renew --cert-name "$cert" --quiet \
    || { echo "GAGAL: $cert (webroot)"; fail=1; }
done
```

"Fase 3" of the script already reloads nginx, so the renewed certificate is picked up.
Dry run: add `--dry-run` to the command above and run it once by hand.

## Operations

```bash
cd /home/rentalize/mysimoka-web/deploy
export DOCKER_CONFIG=$PWD/.docker     # before any manual `docker compose pull`
tail -f /home/rentalize/log/mysimoka-deploy.log
docker compose ps
docker compose logs -f
```

Rollback: set `IMAGE_TAG=<older sha>` in `deploy/.env`, then `docker compose pull && docker compose up -d`.
The next new commit on `main` deploys normally again.
