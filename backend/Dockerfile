FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && npm config set fetch-timeout 300000 \
  && if [ -f package-lock.json ]; then npm ci --omit=dev --no-audit -w backend; else npm install --omit=dev --no-audit -w backend; fi

FROM node:22-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN cd backend && npx prisma generate --schema=prisma/schema.prisma

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=5000

WORKDIR /app

RUN apk add --no-cache dumb-init \
  && addgroup -S safespace \
  && adduser -S safespace -G safespace

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app .

RUN mkdir -p /app/backend/uploads/incidents /app/backend/uploads/snapshots \
  && chown -R safespace:safespace /app

USER safespace

EXPOSE 5000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "backend/server.js"]
