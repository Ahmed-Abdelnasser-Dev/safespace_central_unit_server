# Backend Architecture

## Overview
SafeSpace backend follows a modular monolith architecture:

- `app.js`: Express app composition (middleware + routes)
- `server.js`: Runtime bootstrap (HTTP server + Socket.IO)
- `config/`: startup configuration and environment validation
- `middleware/`: cross-cutting concerns (auth, validation, error handling)
- `modules/`: domain modules (auth, users, nodes, incidents, ai, decisions, activityLogs)
- `utils/`: shared helpers only (logger, prisma, websocket manager, etc.)
- `tests/`: executable integration test scripts and manual test utilities

## Module Contract
Each domain module should keep a consistent internal contract:

- `<domain>.routes.js`: route declarations only
- `<domain>.controller.js`: request/response orchestration only
- `<domain>.service.js`: business logic and data access
- `<domain>.schema.js`: Zod validation schemas

## Routing Conventions
Primary route namespaces:

- `/api/auth`
- `/api/users`
- `/api/nodes`
- `/api/incidents`
- `/api/ai`
- `/api/decisions`
- `/api/activity-logs`

Backward-compatible legacy aliases may exist temporarily during migration and should be removed once clients are updated.

## Naming Conventions
- Folders: lower camelCase by domain (`activityLogs`, `nodeMaintainer` in frontend)
- Module files: singular domain stem (`user.service.js`, `incident.schema.js`)
- General files: `camelCase.js`
- Constants: `UPPER_SNAKE_CASE`

## Configuration
Environment variables are validated once at startup in `config/env.js`. Invalid startup config should fail fast.

Prisma CLI/runtime configuration is split as follows:

- `prisma.config.ts`: datasource URL, migration path, seed command
- `prisma/schema.prisma`: schema models/enums and datasource provider (no inline `url` in Prisma 7)

## Upload Security
Do not trust MIME type alone for uploaded files.

- Snapshot uploads and mobile media uploads run binary signature checks in `middleware/validateFileSignatures.js`.
- Invalid files are rejected and removed from disk before reaching controllers.

## Ingress Auth Toggles
Hardening middleware is feature-flagged for staged rollout:

- `ENFORCE_NODE_API_KEY`: enables `middleware/nodeApiKey.js` on node ingestion routes
- `ENFORCE_MOBILE_SERVER_AUTH`: enables `middleware/mobileServerAuth.js` on mobile server ingress routes

## Testing Layout
Manual/integration scripts are under `tests/`:

- `accident-detection.script.js`
- `heartbeat-video.script.js`
- `blocked-lanes.sh`
- `video-viewer.html`

Run scripts from `backend/package.json` scripts section.
