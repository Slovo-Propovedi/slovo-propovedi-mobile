# syntax=docker/dockerfile:1
#
# Слово.Проповеди — web (PWA).
# Static-only image: the `dist/` folder is produced on the CI runner by
# `yarn web:build` (`expo export -p web`) and transferred here before build.
# No Node.js in the runtime image.

FROM nginx:alpine

LABEL org.opencontainers.image.title="slovo-propovedi-web" \
  org.opencontainers.image.description="Слово.Проповеди — web PWA (static export)"

COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
