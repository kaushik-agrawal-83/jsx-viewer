# Phase 1 — Docker Web Scaffold

## Status
> 🔲 NOT_STARTED  
> Agent: update → 🔄 IN_PROGRESS → ✏️ CODE_COMPLETE → 🧪 TESTING_COMPLETE → ✅ COMPLETE

## Goal
Working repo with two Docker services (frontend Vite dev server + backend Node.js API)
running via `docker-compose up`. Browser shows branded hello-world at `http://localhost:5173`
using Phase 0 colors and fonts.

## Demo Checkpoint
`docker-compose up` → open browser → `http://localhost:5173`:
- [ ] Page title: "JSX Viewer"
- [ ] Primary color `#6366f1` visible (header or button)
- [ ] Inter font loaded
- [ ] `http://localhost:3001/health` returns `{ "status": "ok" }`
- [ ] No console errors

---

## Directory Structure

```
jsx-viewer/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css          ← Tailwind directives + Phase 0 CSS vars
│       └── vite-env.d.ts
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts           ← Express app entry
│       └── routes/
│           └── health.ts
└── docs/
    ├── DESIGN.md
    └── plan/
        ├── PLAN.md
        └── PHASE-*.md
```

---

## Tasks

### Docker Setup
- [ ] `docker-compose.yml` — two services: `frontend` (port 5173) and `backend` (port 3001)
  - `frontend`: build from `./frontend/Dockerfile`, volume-mount `./frontend/src` for hot reload, depends on `backend`
  - `backend`: build from `./backend/Dockerfile`, volume-mount `./backend/src` for hot reload
- [ ] `frontend/Dockerfile` — Node 20 Alpine, install deps, run `vite dev --host 0.0.0.0`
- [ ] `backend/Dockerfile` — Node 20 Alpine, install deps, run `ts-node-dev src/index.ts`
- [ ] `.env.example`:
  ```
  VITE_API_BASE_URL=http://localhost:3001
  PORT=3001
  ```
- [ ] `.gitignore` — `node_modules`, `.env`, `dist`, `*.tsbuildinfo`

### Backend Init
- [ ] `backend/package.json` — deps: `express`, `cors`; devDeps: `typescript`, `ts-node-dev`, `@types/express`, `@types/node`, `jest`, `supertest`, `@types/supertest`, `ts-jest`
- [ ] `backend/tsconfig.json` — `target: ES2020`, `module: commonjs`, `outDir: dist`, `rootDir: src`, `strict: true`
- [ ] `backend/src/index.ts` — Express app, `cors()`, mount health route, listen on `PORT`
- [ ] `backend/src/routes/health.ts` — `GET /health` → `{ status: "ok", version: "0.1.0" }`

### Frontend Init
- [ ] `frontend/package.json` — deps: `react`, `react-dom`, `@vitejs/plugin-react`; devDeps: `typescript`, `vite`, `tailwindcss`, `postcss`, `autoprefixer`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
- [ ] `frontend/vite.config.ts` — React plugin, server `host: true`, `port: 5173`, proxy `/api` → `http://backend:3001`
- [ ] `frontend/tailwind.config.ts` — content paths include `src/**/*.tsx`, extend theme with Phase 0 color tokens (full Tailwind config extension block from PHASE-0.md §Tailwind Config)
- [ ] `frontend/src/index.css` — `@tailwind base/components/utilities`, import Inter + JetBrains Mono from Google Fonts, set `body { background: #080810; color: #f1f5f9; }`
- [ ] `frontend/src/App.tsx` — hello-world layout:
  - Root `<div>` with `bg-app-bg` (dark `#080810`)
  - Glass toolbar: `bg-[rgba(8,8,16,0.80)] backdrop-blur-[12px] border-b border-white/[0.07]`, "⚛ JSX Viewer" in Inter `text-text-primary`
  - Glass sidebar stub: `bg-[rgba(255,255,255,0.04)] backdrop-blur-glass border-r border-white/[0.08]`
  - Viewer pane: `bg-surface` (`#0f0f1c`), centered placeholder text in `text-muted`

### Testing Foundation
- [ ] `backend/jest.config.ts` — `ts-jest`, test files match `**/*.test.ts`
- [ ] `frontend/vite.config.ts` — add `test: { environment: 'jsdom', globals: true }` vitest block
- [ ] `backend/src/__tests__/health.test.ts` — supertest: `GET /health` → 200, body `{ status: "ok" }`
- [ ] `frontend/src/__tests__/App.test.tsx` — renders without throw, `screen.getByText('JSX Viewer')` present

---

## Testing Requirements

### Backend (Jest + Supertest)
- [ ] `cd backend && npm test` — passes with zero failures
- [ ] `GET /health` → 200 `{ status: "ok", version: "0.1.0" }`

### Frontend (Vitest)
- [ ] `cd frontend && npm test` — passes with zero failures
- [ ] App renders "JSX Viewer" heading
- [ ] Zero TypeScript errors: `cd frontend && npx tsc --noEmit`

---

## Done Gate

- [ ] `docker-compose up` — both services start without error
- [ ] `http://localhost:5173` → branded hello-world visible
- [ ] `http://localhost:3001/health` → `{ status: "ok" }`
- [ ] Inter font loaded (check DevTools Network tab)
- [ ] Primary color `#6366f1` visible in UI
- [ ] All tests passing (backend + frontend)
- [ ] Zero TypeScript errors
- [ ] `.env.example` documents all env vars

---

## Dependencies
- **Requires complete:** Phase 0 — UX Design Freeze
- **Enables:** Phase 2 — Pre-commit Hooks + CI

## Notes
- Vite dev server runs inside Docker with `--host 0.0.0.0` so it's accessible from the host.
- Backend proxy in vite config uses service name `backend` (Docker DNS) for container-to-container comms.
- No Tauri packages installed anywhere in this phase. Frontend is pure React/Vite.
- `docker-compose.yml` should use `volumes` for `src/` directories so file edits on host reflect inside containers without rebuild.
