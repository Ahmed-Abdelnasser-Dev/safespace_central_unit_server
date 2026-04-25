# Backend Refactor Log

## 2026-03-07

### Structural changes
- Added environment validation layer in `config/env.js`.
- Added missing schema/controller layers for:
  - AI module
  - Decision module
  - Activity logs module
- Standardized users module file naming to singular stems:
  - `user.routes.js`, `user.controller.js`, `user.service.js`, `user.schema.js`
- Standardized activity logs naming:
  - `activityLog.routes.js`, `activityLog.controller.js`, `activityLog.service.js`, `activityLog.schema.js`
- Moved manual test utilities into `backend/tests/`.

### Route alignment
- Introduced preferred incidents namespace: `/api/incidents`.
- Introduced preferred decisions namespace: `/api/decisions`.
- Kept legacy route aliases for compatibility:
  - incidents under `/api` for existing clients
  - decisions under `/api/decision`

### Dependency cleanup
- Removed unused backend dependencies:
  - `sequelize`
  - `pg-hstore`
  - `bcryptjs`

### Security hardening
- Added optional node ingestion API-key middleware: `middleware/nodeApiKey.js`.
- Added optional mobile server auth middleware: `middleware/mobileServerAuth.js`.
- Added binary file-signature validation (magic number checks):
  - `middleware/validateFileSignatures.js`
  - Applied to mobile media uploads and node snapshot uploads.

### Prisma migration
- Upgraded to Prisma ORM v7 (`prisma` + `@prisma/client`).
- Added PostgreSQL driver adapter dependency: `@prisma/adapter-pg`.
- Added `prisma.config.ts` and moved datasource URL configuration there.
- Updated `utils/prisma.js` to initialize Prisma Client with `PrismaPg` adapter.
- Removed `datasource.url` from `prisma/schema.prisma` (Prisma 7-compatible schema format).

### Notes
- Prisma editor diagnostic for `datasource.url` is resolved after Prisma 7 migration.
