FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci --omit=dev

FROM node:20-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate --schema=prisma/schema.prisma

FROM node:20-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=5000

WORKDIR /app

RUN apk add --no-cache dumb-init \
  && addgroup -S safespace \
  && adduser -S safespace -G safespace

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app .

RUN mkdir -p /app/uploads/incidents /app/uploads/snapshots \
  && chown -R safespace:safespace /app

USER safespace

EXPOSE 5000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
