# Phase 0 Baseline and Freeze Points

Date: 2026-04-25
Branch: spliting_frontend_from_backend
Scope: Monorepo baseline before backend/frontend decoupling and repo extraction.

## 1. Baseline Runtime Snapshot

### Backend baseline
- Backend process started from backend root using `npm start`.
- Health endpoints:
  - `GET /health` -> 200
  - `GET /api/health` -> 200
- Auth flow probe:
  - `POST /api/auth/login` with known seed-style credentials returned 401.
  - Result: auth endpoint is reachable and enforcing credentials.
- Incident decision flow probe:
  - `POST /api/accident-decision` without auth returned 401 with `Authentication required`.
  - Result: decision endpoint is reachable and protected by auth middleware.
- Socket baseline:
  - `GET /socket.io/?EIO=4&transport=polling` -> 200.

### Frontend baseline
- Frontend process started from frontend root using `npm run dev -- --host 0.0.0.0 --port 4000`.
- Route/document probes:
  - `GET /` -> 200
  - `GET /sign-in` -> 200
  - `GET /dashboard` -> 200 (SPA route document served)
- Upload rendering probe:
  - `GET /uploads/incidents/<sample-file>` -> 200
  - `GET /uploads/incidents/` -> 404 (directory listing not exposed, file serving works)

### Incident queue flow baseline
- From `backend/`: `npx jest tests/incidentQueue.test.js --runInBand` passed.
- Result: 1 suite passed, 3 tests passed.

## 2. Freeze Points, Cutover Checkpoints, and Rollback Points

### Cutover checkpoints
- CP1: Backend decoupling complete and backend standalone verification green.
- CP2: Frontend decoupling complete and frontend standalone verification green.
- CP3: Backend extracted repo is green independently.
- CP4: Frontend extracted repo is green independently.
- CP5: Cross-repo integration verification green.
- CP6: Monorepo run scripts frozen/archived after both repos are operational.

### Rollback points
- RP1: After CP1 fails, revert backend-only decoupling edits and re-run baseline checks.
- RP2: After CP2 fails, revert frontend-only decoupling edits and re-run baseline checks.
- RP3: If extraction fails, keep monorepo as active run target until both standalone repos pass gates.
- RP4: Do not perform final cutover unless CP3, CP4, and CP5 are all green.

## 3. Environment Variable Ownership Snapshot

### Backend-owned variables (current)
- `NODE_ENV`
- `PORT`
- `HOST`
- `FRONTEND_URL`
- `ALLOWED_ORIGINS`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `BCRYPT_ROUNDS`
- `MAX_LOGIN_ATTEMPTS`
- `PASSWORD_HISTORY_LIMIT`
- `LOG_LEVEL`
- `MOBILE_APP_SERVER_URL`
- `MOBILE_SERVER_BASE_URL`
- `MOBILE_APP_PROXY_HEADER_NAME`
- `MOBILE_APP_PROXY_HEADER_VALUE`
- `MOBILE_APP_CLIENT_CERT_HEADER_NAME`
- `MOBILE_APP_CLIENT_CERT_HEADER_VALUE`
- `MOBILE_SERVER_SHARED_SECRET`
- `ENFORCE_NODE_API_KEY`
- `ENFORCE_MOBILE_SERVER_AUTH`
- `TEST_DURATION_SEC` (test script only)

### Frontend-owned variables (current references)
- `VITE_API_URL`
- `VITE_WS_URL`
- `DEV` (Vite built-in env)

### Frontend target explicit ownership (during split)
- `VITE_API_URL` (HTTP API base)
- `VITE_SOCKET_URL` (Socket.IO origin)
- `VITE_NODE_VIDEO_WS_URL` (node video websocket origin/path root)

## 4. Immediate Security Hygiene Actions Taken

- Credential-like content was removed from `frontend/readme.md` and replaced with sanitized setup guidance.
