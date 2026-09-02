# syntax=docker/dockerfile:1.7

ARG NODE_IMAGE=node:24-bookworm-slim

FROM ${NODE_IMAGE} AS install

WORKDIR /app

ENV CI=true

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN npm ci


FROM install AS builder

COPY apps/api ./apps/api

RUN npm run build --workspace=api


FROM ${NODE_IMAGE} AS production-dependencies

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN npm ci \
      --omit=dev \
      --workspace=api \
      --include-workspace-root=false \
    && npm cache clean --force


FROM install AS migrator

WORKDIR /app

ENV NODE_ENV=production

COPY apps/api/prisma7.config.ts \
  ./apps/api/prisma7.config.ts

COPY apps/api/prisma \
  ./apps/api/prisma

USER node

WORKDIR /app/apps/api

CMD ["npx", "prisma", "migrate", "deploy", "--config", "prisma7.config.ts"]


FROM ${NODE_IMAGE} AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=production-dependencies \
  --chown=node:node \
  /app/node_modules \
  ./node_modules

COPY --from=production-dependencies \
  --chown=node:node \
  /app/apps/api \
  ./apps/api

COPY --from=builder \
  --chown=node:node \
  /app/apps/api/dist \
  ./apps/api/dist

USER node

EXPOSE 4000

HEALTHCHECK \
  --interval=30s \
  --timeout=5s \
  --start-period=20s \
  --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || '4000') + '/api/v1/health/live').then((response) => { if (!response.ok) process.exit(1); }).catch(() => process.exit(1));"

CMD ["node", "apps/api/dist/main.js"]