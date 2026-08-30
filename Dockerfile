# One deployable image contains both the React app and its Node API. The media library is
# intentionally not copied into the image: users can cache it once in their browser.
FROM --platform=$BUILDPLATFORM node:22-alpine AS frontend
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:22-alpine

ARG VERSION=dev
ARG VCS_REF=dev
ARG BUILD_DATE=unknown

LABEL maintainer="Kingdaniel4747 https://github.com/Kingdaniel4747" \
      org.opencontainers.image.title="AthletiQ" \
      org.opencontainers.image.description="Self-hosted training, nutrition and progress tracker." \
      org.opencontainers.image.source="https://github.com/Kingdaniel4747/Athletiq" \
      org.opencontainers.image.url="https://github.com/Kingdaniel4747/Athletiq/pkgs/container/athletiq" \
      org.opencontainers.image.documentation="https://github.com/Kingdaniel4747/Athletiq#readme" \
      org.opencontainers.image.licenses="AGPL-3.0-or-later" \
      org.opencontainers.image.version=$VERSION \
      org.opencontainers.image.revision=$VCS_REF \
      org.opencontainers.image.created=$BUILD_DATE

WORKDIR /app
COPY api/package.json api/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY api/server.js ./
COPY --from=frontend /build/dist ./public

ENV NODE_ENV=production \
    PORT=3000 \
    DATA_DIR=/data \
    WEB_DIR=/app/public

EXPOSE 3000
VOLUME ["/data"]

HEALTHCHECK --interval=5m --timeout=5s --retries=3 \
  CMD wget --spider -q "http://127.0.0.1:${PORT}/api/health" || exit 1

CMD ["node", "server.js"]
