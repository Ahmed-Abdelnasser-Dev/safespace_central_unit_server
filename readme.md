# SafeSpace Central Unit

## Frontend Dashboard Structure

The frontend (Vite + React + Tailwind) now implements a modular Dashboard UI built from small reusable components.

### Design System
Global tokens live in `frontend/src/designSystem.js` and mirror Tailwind theme extensions in `frontend/tailwind.config.js`:
- Colors: `safe-*` palette (dark, blue, gray shades, accent, danger, success, info)
- Typography utilities: heading, subheading, body, tiny
- Spacing, radii, shadows, layout container helper

### Components (in `frontend/src/components/`)
- `LayoutContainer.jsx` – Consistent max-width wrapper
- `DashboardCard.jsx` – Card shell with title + optional icon
- `StatBlock.jsx` – Compact metric + trend arrow
- `ChartWrapper.jsx` – Placeholder wrapper for future charts
- `GridSection.jsx` – Grid abstraction (12-column responsive)

### Screens (in `frontend/src/screens/`)
- `Dashboard.jsx` – Default route `/`, assembles KPI cards, charts, performance and alerts list
- `SystemTest.jsx` – Original backend connectivity test, now at `/system-test`

### Icons
Font Awesome integrated via `@fortawesome` packages. Library initialized in `src/icons.js` and imported once in `main.jsx`.

### Routing
React Router v6 setup in `App.jsx`. Navigation links provided in header.

### Tailwind Extensions
Updated `tailwind.config.js` with color palette, box shadow `shadow-card`, custom font family. All components use utility classes for rapid styling and responsive layout.

### Running
From `frontend/`:
```bash
npm install
npm run dev
```

### Next Steps (Potential)
- Replace `ChartWrapper` with real charts (e.g. Recharts / Chart.js)
- Connect live data sources (WebSocket / MQTT)
- Add global state (Redux Toolkit slices) for metrics
- Accessibility & dark/light theme toggle (currently dark-first design)

---
This structure emphasizes scalability and ease of extension for future monitoring panels.

klam fady