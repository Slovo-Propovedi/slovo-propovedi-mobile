# syntax=docker/dockerfile:1
#
# Слово.Проповеди — web (PWA).
# Static-only image: the `dist/` folder is produced on the CI runner by
# `yarn web:build` and shipped as the build context by the release workflow's
# buildx step (DOCKER_HOST over SSH). No Node.js in the runtime image.

FROM nginx:alpine

LABEL org.opencontainers.image.title="slovo-propovedi-web" \
  org.opencontainers.image.description="Слово.Проповеди — web PWA (static export)"

# OCI source label: links the image in the Forgejo container registry back to
# the mobile repository's Packages tab (belt-and-suspenders alongside the
# registry-path naming convention). It points at the REPO ROOT — the nested
# /web image still belongs to that repo. No hardcoded value: both web-image
# build steps (release.yml + ota-publish.yml) inject it via
# --build-arg OCI_IMAGE_SOURCE="${REPOSITORY_URL}/${GITHUB_REPOSITORY}".
# The ARG (no default) is declared in this stage scope, next to the LABEL it
# feeds (Dockerfile limitation: one variable per LABEL instruction).
ARG OCI_IMAGE_SOURCE

LABEL org.opencontainers.image.source=$OCI_IMAGE_SOURCE

COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
