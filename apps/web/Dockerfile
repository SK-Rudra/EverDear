# syntax=docker/dockerfile:1.7

ARG NODE_IMAGE=node:24-bookworm-slim

FROM ${NODE_IMAGE} AS install

WORKDIR /app

ENV CI=true
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN npm ci


FROM install AS builder

WORKDIR /app

ARG NEXT_PUBLIC_API_URL

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1

COPY apps/web ./apps/web

RUN test -n "${NEXT_PUBLIC_API_URL}" \
    || (echo "NEXT_PUBLIC_API_URL is required" && exit 1)

RUN npm run build --workspace=web


FROM ${NODE_IMAGE} AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=builder \
  --chown=node:node \
  /app/apps/web/public \
  ./apps/web/public

COPY --from=builder \
  --chown=node:node \
  /app/apps/web/.next/standalone \
  ./

COPY --from=builder \
  --chown=node:node \
  /app/apps/web/.next/static \
  ./apps/web/.next/static

USER node

EXPOSE 3000

HEALTHCHECK \
  --interval=30s \
  --timeout=5s \
  --start-period=20s \
  --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || '3000') + '/').then((response) => { if (!response.ok) process.exit(1); }).catch(() => process.exit(1));"

CMD ["node", "apps/web/server.js"]