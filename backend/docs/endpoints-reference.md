# Backend Endpoints Reference

This file lists all currently exposed backend endpoints for the SafeSpace Central Unit.

## Base
- Default local base URL: `http://localhost:5000`

## Health and Utility
- `GET /health`
  - Service health check.
  - Access: Public.
- `GET /api/health`
  - Detailed API/service health check.
  - Access: Public.
- `GET /api/test-frontend`
  - Frontend connectivity test endpoint.
  - Access: Public.
- `GET /uploads/*`
  - Static file serving for uploaded media.
  - Access: Public.

## Auth (`/api/auth`)
- `POST /api/auth/login`
  - User login.
  - Access: Public.
- `POST /api/auth/refresh`
  - Refresh access token.
  - Access: Public.
- `POST /api/auth/logout`
  - Revoke refresh token.
  - Access: Public.
- `POST /api/auth/mfa/verify`
  - Verify MFA code.
  - Access: Public.
- `POST /api/auth/change-password`
  - Change password (first-login or authenticated flow).
  - Access: Public route.

## Users (`/api/users`)
All user routes are JWT protected (`protect`).

- `GET /api/users/me`
  - Get current user profile.
  - Access: Authenticated user.
- `PATCH /api/users/me`
  - Update current user profile.
  - Access: Authenticated user.
- `PATCH /api/users/me/photo`
  - Upload/update current user profile photo.
  - Access: Authenticated user.

Admin-only routes (`authorize('admin')`):
- `GET /api/users`
- `POST /api/users`
- `GET /api/users/:id`
- `PATCH /api/users/:id`
- `PATCH /api/users/:id/deactivate`
- `PATCH /api/users/:id/reactivate`
- `DELETE /api/users/:id`

## Activity Logs (`/api/activity-logs`)
All routes are JWT protected.

- `GET /api/activity-logs`
  - List activity/audit logs.
  - Access: Authenticated user (service applies role-based filtering).

## Incidents
Incidents routes are mounted in two namespaces for compatibility:
- Preferred: `/api/incidents/*`
- Legacy alias: `/api/*`

Available routes:
- `POST /api/incidents/accident-detected`
- `POST /api/accident-detected`
  - Legacy HTTP accident ingestion endpoint.
  - Access: Internal ingestion path.

- `POST /api/incidents/accident-decision`
- `POST /api/accident-decision`
  - Submit accident decision.
  - Access: JWT + `authorize('admin', 'road_observer')`.

- `POST /api/incidents/mobile-accident-detected`
- `POST /api/mobile-accident-detected`
  - Mobile multipart accident report ingestion.
  - Access: Optional mobile server auth middleware (`mobileServerAuth`) depending on env toggles.

- `POST /api/incidents/central-unit/send-accident-to-central-unit`
- `POST /api/central-unit/send-accident-to-central-unit`
  - Server-to-server mobile JSON ingestion.
  - Access: Optional mobile server auth middleware (`mobileServerAuth`) depending on env toggles.

## Nodes (`/api/nodes`)
- `POST /api/nodes/heartbeat`
  - Node heartbeat ingestion.
  - Access: Optional node API key middleware (`nodeApiKey`) depending on env toggles.
- `POST /api/nodes/register`
  - Node registration.
  - Access: Optional node API key middleware (`nodeApiKey`) depending on env toggles.
- `POST /api/nodes/:nodeId/snapshot`
  - Node snapshot upload.
  - Access: Optional node API key middleware (`nodeApiKey`) depending on env toggles.

Current management routes:
- `GET /api/nodes`
- `GET /api/nodes/:nodeId`
- `PATCH /api/nodes/:nodeId`
- `DELETE /api/nodes/:nodeId`

## AI (`/api/ai`)
- `POST /api/ai/analyze`
  - AI analysis test/debug endpoint.
  - Access: Public route (no JWT middleware currently applied).

## Decision (`/api/decisions` and legacy `/api/decision`)
- `POST /api/decisions/analyze`
- `POST /api/decision/analyze`
  - Decision-engine analysis test/debug endpoint.
  - Access: Public route (no JWT middleware currently applied).

## Real-Time Endpoints

### Socket.IO
- Transport endpoint: Socket.IO default path on this server (typically `/socket.io`).
- Used for dashboard/client real-time events.
- Important inbound events handled:
  - `node_accident_detected`
  - `admin_accident_response`

### Raw WebSocket
- Endpoint: `WS /ws/nodes`
- Used by node and dashboard websocket flows managed by `websocketManager`.
- Supported message types include:
  - `register`
  - `heartbeat`
  - `incident`
  - `video_frame`
  - `dashboard_subscribe`

## Notes
- API rate limiter is applied under `/api`.
- A catch-all 404 handler is enabled for unknown routes.
- Effective access behavior for optional auth middlewares depends on environment flags in `config/env.js`.
