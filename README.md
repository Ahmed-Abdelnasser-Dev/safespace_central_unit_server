# SafeSpace Central Unit (Monorepo, Archived)

> **This is the earlier monorepo version of the SafeSpace Central Unit.** Development moved to two separate repos in April 2026:
>
> - Backend: [safespace-central-unit-backend](https://github.com/Ahmed-Abdelnasser-Dev/safespace-central-unit-backend)
> - Dashboard: [safespace-central-unit-frontend](https://github.com/Ahmed-Abdelnasser-Dev/safespace-central-unit-frontend)
>
> This repo is kept for history.

**SafeSpace** is an AI-powered system for real-time highway accident detection and prevention, built as a graduation project at **Suez Canal University, Faculty of Engineering** (Computer Engineering).

## What is here

An npm workspaces monorepo with both halves of the Central Unit:

```
backend/     Express + Prisma + PostgreSQL API, Socket.IO, ws for detection nodes
frontend/    React + Vite + Tailwind operator dashboard
project-docs/
compose.yaml
```

### Backend

- Express 4 with modular domains (auth, users, nodes, incidents, ai, decision)
- PostgreSQL via Prisma, real-time updates via Socket.IO and `ws`, MQTT for devices
- JWT auth with bcrypt, Zod validation, Helmet, rate limiting, Winston logging
- Geospatial processing with Turf.js

### Frontend

- React 18 + Vite, Redux Toolkit, React Router
- Tailwind CSS with a custom `safe-*` design system
- MapLibre maps, Socket.IO client, Font Awesome icons
- Modular dashboard built from small reusable components (cards, stat blocks, grids)

## Running it

```bash
cp .env.example .env
npm run install:all
npm run dev            # starts backend and frontend together
```

Or with Docker:

```bash
docker compose up --build
```
