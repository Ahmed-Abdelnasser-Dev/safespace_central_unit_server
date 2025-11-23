# Safe Space Monitoring Dashboard – Frontend Instruction File

## 0. System Instruction for AI
**Instruction to Copilot:**  
You are an expert Frontend Engineer specializing in Real-time Dashboards using React, Redux Toolkit, and GSAP. Adhere strictly to the security, testing, and performance guidelines below. The design must be consistent and utilize Global Components exclusively for UI elements.

## 1. Project Purpose & Scope
**System:** Safe Space Monitoring Dashboard (Central Unit UI).  
**Role:** Real-time monitoring, decision override, and high-speed data visualization.  
**Key Constraints:** High security, high performance, and visual fidelity (GSAP).

## 2. Technology Stack (Strict)
- Framework: React (v18+) with Vite  
- Language: JavaScript (ES6+)  
- Styling: Tailwind CSS (Structure) + GSAP (Animation)  
- State: @reduxjs/toolkit + react-redux  
- Networking: axios (Linked via Redux Async Thunks)  
- Maps: maplibre-gl + react-map-gl  
- Real-time: socket.io-client  

## 3. Folder Structure (Refined for Redux & Testing)
```
src/
├── app/                   # Global Redux Setup (store.js, rootReducer.js)
├── components/            # GLOBAL/REUSABLE COMPONENTS (Consistency Enforced!)
│   ├── ui/                # Atomic UI Elements (Button, Input, Card)
│   └── layout/            # Sidebar, Header, PageWrapper
├── features/              # DOMAIN MODULES (The Core Logic)
│   ├── incidents/         # Accident feed, decision modals
│   │   ├── components/    # Components specific to Incidents only
│   │   ├── services/      # API calls (e.g., approveIncident.js)
│   │   ├── incidentsSlice.js # Reducers, Selectors, Thunks (Redux Logic)
│   │   └── __tests__/     # Unit tests for slice logic
│   ├── auth/              
│   │   └── authSlice.js
│   └── maps/              # Map-specific components and logic
├── hooks/                 # Global Hooks (useSocket, useAuth)
├── lib/                   # Utility libraries (Axios instance, Zod Schemas)
└── pages/                 # Route Pages (e.g., DashboardPage.jsx)
```

## 4. Coding Style & Global Components
- **Design Consistency:** MUST utilize components from src/components/ui/ or src/components/layout/ for all foundational visual elements (Buttons, Inputs, Cards, Modals). NEVER define a new button style inside a feature component.  
- **JSDoc:** Mandatory for all custom hooks and utility functions.  
- **State Access:** Use Redux selectors (useSelector) only. Components should not access the raw state object.  
- **GSAP Usage:** Use the useGSAP hook for all animations.

## 5. Error Handling
- **Global Boundary:** Wrap the main application layout in an Error Boundary component.  
- **API (Axios/Redux):**  
  - Thunks must use rejectWithValue to send structured error messages to the slice.  
  - Slices must handle the rejected state to store the error message in Redux.  
- **UI Feedback:** Use toast notifications (e.g., react-hot-toast) for non-critical, user-actionable errors.  
- **Critical Errors:** Display a full-page error view with a correlation ID (from backend logs) for unrecoverable errors (401, 500).

## 6. Security Guidelines
- **Authentication:** JWT token must be protected; prefer HttpOnly cookies. Implement silent token refresh if using localStorage.  
- **Route Guards:** Administrative pages MUST be wrapped in <ProtectedRoute> verifying role and authentication status from Redux.  
- **Data Minimization:** Do not store sensitive or unneeded PII in Redux.  
- **XSS Prevention:** Avoid dangerouslySetInnerHTML unless content is sanitized with a library like DOMPurify.  
- **Axios Interceptors:** Automatically catch 401 responses and force logout.

## 7. Testing Guidelines
- **Framework:** Vitest for unit testing (preferred for Vite).  
- **Testing Library:** React Testing Library for components.  
- **Redux Logic:**  
  - Unit test Reducers and Selectors.  
  - Mock Axios when testing Async Thunks; verify dispatched actions.  
- **E2E:** Critical functions (Admin Decision Override) must have E2E tests (Playwright/Cypress).

## 8. Performance & Optimization
- **Memoization:**  
  - React.memo() for components with static props.  
  - useCallback for functions passed as props.  
  - createSelector for Redux selectors to prevent unnecessary re-renders.  
- **Code Splitting:** React.lazy() + Suspense for routes.  
- **Virtualization:** Use react-window or react-virtualized for long lists.  
- **Map Rendering:** Memoize MapLibre component to prevent re-rendering entire map canvas.

## 9. Animation Best Practices
- **Library:** GSAP for all complex animations.  
- **Avoid:** Do not animate width, height, left, top (layout-shifting).  
- **Optimization:** Animate transform (x, y, scale, rotation) and opacity only.  
- **Staggering:** Use GSAP's stagger for lists.  
- **Cleanup:** Always use useGSAP or cleanup in useEffect to prevent memory leaks.
