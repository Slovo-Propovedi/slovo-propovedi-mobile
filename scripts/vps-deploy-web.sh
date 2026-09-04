#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# VPS deployment — Слово.Проповеди web (PWA)
# =============================================================================
# Runs ON the VPS as root, over SSH from the Forgejo `release` workflow
# (`web` job). Mirrors slovo-propovedi-docs/scripts/vps-deploy.sh: builds a
# tiny nginx image from the transferred `dist/` and runs it behind the shared
# Traefik reverse proxy, routed by Host label.
#
# Usage:  DEPLOY_TAG=v1.2.3 WEB_HOSTNAME=app.example.com bash vps-deploy-web.sh
#
# Idempotent. If Traefik is not running it is auto-provisioned (ACME_EMAIL
# then required) — same layout the docs deploy uses, so on a host that already
# runs slovo-docs this just adds a second container on the `traefik` network.
# =============================================================================

DEPLOY_TAG="${DEPLOY_TAG:?ERROR: DEPLOY_TAG is required (e.g. v1.2.3)}"
WEB_HOSTNAME="${WEB_HOSTNAME:?ERROR: WEB_HOSTNAME is required (e.g. app.example.com)}"
BASE_PATH="${BASE_PATH:-/slovo/web}"
SRC_PATH="${SRC_PATH:-/slovo/web/container-src}"
BUILDER_NAME="${BUILDER_NAME:-slovo-constrained}"
BUILDX_MEMORY="${BUILDX_MEMORY:-1g}"
BUILDX_CPU_QUOTA="${BUILDX_CPU_QUOTA:-80000}"
IMAGE_NAME="${IMAGE_NAME:-slovo-web:latest}"
CONTAINER_NAME="${CONTAINER_NAME:-slovo-web}"
CONTAINER_PORT="${CONTAINER_PORT:-8080}"
CONTAINER_NETWORK="${CONTAINER_NETWORK:-slovo-web}"
TRAEFIK_NETWORK="${TRAEFIK_NETWORK:-traefik}"
MEMORY_LIMIT="${MEMORY_LIMIT:-48m}"
STOP_GRACE="${STOP_GRACE:-3}"
TRAEFIK_SERVICE="${TRAEFIK_SERVICE:-slovo-traefik.service}"
ACME_EMAIL="${ACME_EMAIL:-}"
TRAEFIK_IMAGE="${TRAEFIK_IMAGE:-traefik:v3.4}"
TRAEFIK_BASE_PATH="${TRAEFIK_BASE_PATH:-/slovo/traefik}"

echo "==============================================================="
echo "  VPS deployment — web"
echo "  Tag:      $DEPLOY_TAG"
echo "  Hostname: $WEB_HOSTNAME"
echo "==============================================================="

echo ">> Ensuring prerequisites..."

if ! command -v docker >/dev/null 2>&1; then
  echo "  Docker: missing -> installing..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi
echo "  Docker: OK"

if ! getent group slovo >/dev/null 2>&1; then groupadd --system slovo; fi
if ! id -u slovo >/dev/null 2>&1; then
  useradd --system --no-create-home --shell /sbin/nologin --home /slovo --gid slovo slovo
fi
SLOVO_UID=$(id -u slovo)
SLOVO_GID=$(id -g slovo)
echo "  slovo user: OK (uid=$SLOVO_UID, gid=$SLOVO_GID)"

if ! docker buildx inspect "$BUILDER_NAME" >/dev/null 2>&1; then
  echo "  buildx builder '$BUILDER_NAME': missing -> creating..."
  docker buildx create \
    --name "$BUILDER_NAME" \
    --driver docker-container \
    --driver-opt memory="$BUILDX_MEMORY" \
    --driver-opt cpu-quota="$BUILDX_CPU_QUOTA" \
    --bootstrap
fi
echo "  buildx builder: OK ($BUILDER_NAME)"

if ! docker network inspect "$TRAEFIK_NETWORK" >/dev/null 2>&1; then
  docker network create "$TRAEFIK_NETWORK"
fi
echo "  traefik network: OK ($TRAEFIK_NETWORK)"

if ! systemctl is-active --quiet "$TRAEFIK_SERVICE" 2>/dev/null; then
  echo "  Traefik ($TRAEFIK_SERVICE): missing -> provisioning..."

  if [ -z "$ACME_EMAIL" ]; then
    echo "ERROR: Traefik is not running and ACME_EMAIL is not set."
    echo "       Add ACME_EMAIL as a Forgejo repo secret, or set"
    echo "       TRAEFIK_SERVICE=<name> if Traefik runs under another name."
    exit 1
  fi

  mkdir -p "$TRAEFIK_BASE_PATH/config" "$TRAEFIK_BASE_PATH/acme"

  cat > "$TRAEFIK_BASE_PATH/config/traefik.yml" <<TRAEFIK_YML
entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: web-secure
          scheme: https
  web-secure:
    address: ":443"

certificatesResolvers:
  default:
    acme:
      email: $ACME_EMAIL
      storage: /etc/traefik/acme/acme.json
      httpChallenge:
        entryPoint: web

providers:
  docker:
    endpoint: unix:///var/run/docker.sock
    exposedByDefault: false
    network: traefik

log:
  level: INFO
TRAEFIK_YML

  touch "$TRAEFIK_BASE_PATH/acme/acme.json"
  chmod 600 "$TRAEFIK_BASE_PATH/acme/acme.json"
  docker pull "$TRAEFIK_IMAGE"

  cat > "/etc/systemd/system/$TRAEFIK_SERVICE" <<TRAEFIK_SVC
[Unit]
Description=slovo-traefik
Requires=docker.service
After=docker.service
DefaultDependencies=no

[Service]
Type=simple
Environment="HOME=/root"
ExecStartPre=-/usr/bin/env sh -c '/usr/bin/env docker stop -t 30 slovo-traefik 2>/dev/null || true'
ExecStartPre=-/usr/bin/env sh -c '/usr/bin/env docker rm slovo-traefik 2>/dev/null || true'
ExecStartPre=/usr/bin/env docker create \\
    --rm \\
    --name=slovo-traefik \\
    --log-driver=none \\
    --publish=80:80 \\
    --publish=443:443 \\
    --mount type=bind,src=/var/run/docker.sock,dst=/var/run/docker.sock \\
    --mount type=bind,src=$TRAEFIK_BASE_PATH/config,dst=/etc/traefik \\
    --mount type=bind,src=$TRAEFIK_BASE_PATH/acme,dst=/etc/traefik/acme \\
    --network=traefik \\
    --label traefik.enable=false \\
    $TRAEFIK_IMAGE
ExecStart=/usr/bin/env docker start --attach slovo-traefik
ExecStop=-/usr/bin/env sh -c '/usr/bin/env docker stop -t 30 slovo-traefik 2>/dev/null || true'
Restart=always
RestartSec=5
SyslogIdentifier=slovo-traefik

[Install]
WantedBy=multi-user.target
TRAEFIK_SVC

  systemctl daemon-reload
  systemctl enable --now "$TRAEFIK_SERVICE"

  for _ in $(seq 1 15); do
    systemctl is-active --quiet "$TRAEFIK_SERVICE" 2>/dev/null && break
    sleep 2
  done
  if ! systemctl is-active --quiet "$TRAEFIK_SERVICE" 2>/dev/null; then
    echo "ERROR: Traefik failed to start."
    systemctl status "$TRAEFIK_SERVICE" --no-pager -l || true
    exit 1
  fi
  echo "  Traefik: provisioned"
else
  echo "  Traefik: OK ($TRAEFIK_SERVICE active)"
fi

echo ">> Ensuring paths exist..."
mkdir -p "$BASE_PATH" "$SRC_PATH"
chown slovo:slovo "$BASE_PATH" "$SRC_PATH"
chmod 0750 "$BASE_PATH" "$SRC_PATH"

echo ">> Verifying transferred build at $SRC_PATH..."
if [ ! -f "$SRC_PATH/Dockerfile" ] || [ ! -f "$SRC_PATH/dist/index.html" ]; then
  echo "ERROR: expected $SRC_PATH/Dockerfile and $SRC_PATH/dist/index.html."
  echo "       The workflow transfers dist/ + Dockerfile + nginx.conf first."
  exit 1
fi
chown -R slovo:slovo "$SRC_PATH"

echo ">> Writing Traefik labels..."
{
  printf 'traefik.enable=true\n'
  printf 'traefik.docker.network=%s\n' "$TRAEFIK_NETWORK"
  printf 'traefik.http.services.slovo-web.loadbalancer.server.port=%s\n' "$CONTAINER_PORT"
  printf 'traefik.http.routers.slovo-web.rule=Host(`%s`)\n' "$WEB_HOSTNAME"
  printf 'traefik.http.routers.slovo-web.service=slovo-web\n'
  printf 'traefik.http.routers.slovo-web.entrypoints=web-secure\n'
  printf 'traefik.http.routers.slovo-web.tls=true\n'
  printf 'traefik.http.routers.slovo-web.tls.certResolver=default\n'
} > "$BASE_PATH/labels"
chown slovo:slovo "$BASE_PATH/labels"
chmod 0640 "$BASE_PATH/labels"

echo ">> Ensuring Docker network '$CONTAINER_NETWORK'..."
docker network inspect "$CONTAINER_NETWORK" >/dev/null 2>&1 \
  || docker network create "$CONTAINER_NETWORK"

echo ">> Building image (nginx + static dist)..."
docker buildx build \
  --builder="$BUILDER_NAME" \
  --load \
  --tag="$IMAGE_NAME" \
  "$SRC_PATH"

echo ">> Writing systemd unit..."
cat > "/etc/systemd/system/$CONTAINER_NAME.service" <<EOF
[Unit]
Description=$CONTAINER_NAME
Requires=docker.service
After=docker.service
Wants=$TRAEFIK_SERVICE
After=$TRAEFIK_SERVICE
DefaultDependencies=no

[Service]
Type=simple
Environment="HOME=/root"
ExecStartPre=-/usr/bin/env docker rm -f $CONTAINER_NAME
ExecStartPre=/usr/bin/env docker create \\
    --name=$CONTAINER_NAME \\
    --log-driver=none \\
    --user=$SLOVO_UID:$SLOVO_GID \\
    --cap-drop=ALL \\
    --read-only \\
    --tmpfs /tmp:rw,noexec,nosuid,size=16m,uid=$SLOVO_UID,gid=$SLOVO_GID,mode=1777 \\
    --tmpfs /var/cache/nginx:rw,noexec,nosuid,size=16m,uid=$SLOVO_UID,gid=$SLOVO_GID,mode=0700 \\
    --tmpfs /run:rw,noexec,nosuid,size=8m,uid=$SLOVO_UID,gid=$SLOVO_GID,mode=0755 \\
    --network=$CONTAINER_NETWORK \\
    --label-file=$BASE_PATH/labels \\
    --memory=$MEMORY_LIMIT \\
    $IMAGE_NAME
ExecStartPre=/usr/bin/env docker network connect $TRAEFIK_NETWORK $CONTAINER_NAME
ExecStart=/usr/bin/env docker start --attach $CONTAINER_NAME
ExecStop=-/usr/bin/env docker stop -t $STOP_GRACE $CONTAINER_NAME
Restart=always
RestartSec=30
SyslogIdentifier=$CONTAINER_NAME

[Install]
WantedBy=multi-user.target
EOF

echo ">> Reloading systemd and restarting service..."
systemctl daemon-reload
systemctl restart "$CONTAINER_NAME.service"

sleep 2
if systemctl is-active --quiet "$CONTAINER_NAME.service"; then
  echo "[OK] $CONTAINER_NAME.service is running"
  echo "[OK] Deployment of $DEPLOY_TAG complete — https://$WEB_HOSTNAME"
else
  echo "ERROR: $CONTAINER_NAME.service failed to start"
  systemctl status "$CONTAINER_NAME.service" --no-pager -l || true
  exit 1
fi

rm -f /tmp/vps-deploy-web.sh
echo ">> Done."
