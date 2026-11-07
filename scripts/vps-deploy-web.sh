#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# VPS deployment — Слово.Проповеди web (PWA)
# =============================================================================
# Runs ON the VPS as root, over SSH from the Forgejo `release` workflow
# (`web` job). Mirrors slovo-propovedi-docs/scripts/vps-deploy.sh: pulls the
# web image from the Forgejo container registry and runs it behind the shared
# Traefik reverse proxy, routed by Host label.
#
# Usage:  DEPLOY_TAG=v1.2.3 IMAGE_REF=git.lightnode.ru/slovo_propovedi/slovo-propovedi-mobile/web \
#         WEB_HOSTNAME=app.example.com bash vps-deploy-web.sh
#
# The release workflow builds the image (the dist/ export shipped by buildx as
# the build context) with the shared `slovo-constrained` buildx builder ON this
# host and pushes it to the Forgejo container registry; this script only pulls
# the published tag. No source tree is shipped to the VPS. The registry is
# public (public org), so the pull is anonymous.
#
# Usage also requires TRAEFIK_NETWORK, TRAEFIK_SERVICE and BUILDX_BUILDER —
# Forgejo org variables that mirror the slovo-propovedi playbook's names.
#
# Idempotent. Scope: this script owns ONLY the slovo-web container and its own
# slovo-web network. Shared infrastructure — Docker, the slovo user, the buildx
# builder, Traefik and its network — is owned by the slovo-propovedi playbook
# (`just setup-all`). Missing infrastructure is a HARD ERROR here; it is never
# auto-provisioned (same contract as the backend, docs and landing deploys).
# =============================================================================

DEPLOY_TAG="${DEPLOY_TAG:?ERROR: DEPLOY_TAG is required (e.g. v1.2.3)}"
WEB_HOSTNAME="${WEB_HOSTNAME:?ERROR: WEB_HOSTNAME is required (e.g. app.example.com)}"
BASE_PATH="${BASE_PATH:-/slovo/web}"
# Full registry image ref (no tag) — passed by the release workflow. Required,
# no default: a renamed registry/org must fail loudly instead of pulling
# or creating a container from a stale local image.
IMAGE_REF="${IMAGE_REF:?ERROR: IMAGE_REF is required (full registry image ref, passed by the release workflow)}"
IMAGE="$IMAGE_REF:$DEPLOY_TAG"
CONTAINER_NAME="${CONTAINER_NAME:-slovo-web}"
CONTAINER_PORT="${CONTAINER_PORT:-8080}"
CONTAINER_NETWORK="${CONTAINER_NETWORK:-slovo-web}"
MEMORY_LIMIT="${MEMORY_LIMIT:-48m}"
STOP_GRACE="${STOP_GRACE:-3}"

# Shared infrastructure names — owned by the playbook, passed by the workflow
# from Forgejo org variables. No defaults: a renamed network/builder must fail
# loudly here instead of silently using a stale hardcoded name.
TRAEFIK_NETWORK="${TRAEFIK_NETWORK:?ERROR: TRAEFIK_NETWORK is required (Forgejo org variable)}"
TRAEFIK_SERVICE="${TRAEFIK_SERVICE:?ERROR: TRAEFIK_SERVICE is required (Forgejo org variable)}"
BUILDER_NAME="${BUILDX_BUILDER:?ERROR: BUILDX_BUILDER is required (Forgejo org variable)}"

echo "==============================================================="
echo "  VPS deployment — web"
echo "  Tag:      $DEPLOY_TAG"
echo "  Hostname: $WEB_HOSTNAME"
echo "==============================================================="

# --- Verify prerequisites (playbook-owned; never auto-provisioned) ---
echo ">> Verifying prerequisites..."

fail_missing() {
  echo "ERROR: $1" >&2
  echo "       Shared infrastructure is owned by the slovo-propovedi playbook." >&2
  echo "       Provision it first:  just setup-all   (or: just setup-service <name>)" >&2
  exit 1
}

command -v docker >/dev/null 2>&1 || fail_missing "Docker is not installed."
systemctl is-active --quiet docker || fail_missing "Docker service is not running."
echo "  Docker: OK"

getent group slovo >/dev/null 2>&1 || fail_missing "Group 'slovo' does not exist (playbook slovo-base role)."
id -u slovo >/dev/null 2>&1 || fail_missing "User 'slovo' does not exist (playbook slovo-base role)."
SLOVO_UID=$(id -u slovo)
SLOVO_GID=$(id -g slovo)
echo "  slovo user: OK (uid=$SLOVO_UID, gid=$SLOVO_GID)"

docker buildx inspect "$BUILDER_NAME" >/dev/null 2>&1 \
  || fail_missing "buildx builder '$BUILDER_NAME' does not exist (playbook slovo-buildx role)."
echo "  buildx builder: OK ($BUILDER_NAME)"

docker network inspect "$TRAEFIK_NETWORK" >/dev/null 2>&1 \
  || fail_missing "Docker network '$TRAEFIK_NETWORK' does not exist."
echo "  traefik network: OK ($TRAEFIK_NETWORK)"

systemctl is-active --quiet "$TRAEFIK_SERVICE" 2>/dev/null \
  || fail_missing "Required service '$TRAEFIK_SERVICE' is not running."
echo "  Traefik: OK ($TRAEFIK_SERVICE active)"

echo ">> Ensuring paths exist..."
mkdir -p "$BASE_PATH"
chown slovo:slovo "$BASE_PATH"
chmod 0750 "$BASE_PATH"

echo ">> Writing Traefik labels..."
{
  printf 'traefik.enable=true\n'
  printf 'traefik.docker.network=%s\n' "$TRAEFIK_NETWORK"
  printf 'traefik.http.services.slovo-web.loadbalancer.server.port=%s\n' "$CONTAINER_PORT"
  # shellcheck disable=SC2016 # literal backticks are Traefik label syntax
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

echo ">> Pulling image $IMAGE..."
# The image was built and pushed by the release workflow through the shared
# `slovo-constrained` builder. The org is public, so the pull is anonymous —
# no registry credentials are stored on the VPS. The version tag stays in the
# registry, keeping old releases redeployable for rollback.
if ! docker pull "$IMAGE"; then
  echo "ERROR: docker pull failed for $IMAGE (built and pushed by the release workflow?)"
  exit 1
fi

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
    $IMAGE
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

# --- Post-deploy cleanup (non-fatal, best effort) ---
# Runs only after the new service is confirmed active. Prunes dangling images
# only (no --all) — old release tags stay on disk and in the registry on
# purpose, they are the rollback path. Strictly non-fatal — with `set -e` a
# cleanup failure must never fail a successful deployment.
echo ">> Pruning dangling Docker images..."
if ! docker image prune --force; then
  echo "WARN: docker image prune failed — skipping dangling image cleanup" >&2
fi

rm -f /tmp/vps-deploy-web.sh
echo ">> Done."
