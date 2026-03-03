FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json

RUN npm ci --omit=dev --workspace=backend

FROM node:20-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/backend/package.json ./backend/package.json
COPY backend ./backend

RUN npx prisma generate --schema=backend/prisma/schema.prisma

FROM node:20-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=5000

WORKDIR /app/backend

RUN apk add --no-cache dumb-init \
  && addgroup -S safespace \
  && adduser -S safespace -G safespace

COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/backend /app/backend

RUN mkdir -p /app/backend/uploads/incidents /app/backend/uploads/snapshots \
  && chown -R safespace:safespace /app

USER safespace

EXPOSE 5000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
