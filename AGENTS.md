# Calendar Booking — agent instructions

## Architecture

Two-package monorepo with an API spec:

| Directory | Tech | Entrypoint | Port |
|-----------|------|------------|------|
| `backend/` | Java 21, Spring Boot 3.4.5, Maven | `calendarbooking.CalendarBookingApplication` | 8080 |
| `frontend/` | React 19, TypeScript 6.0, Vite 8, Mantine UI 9 | `src/main.tsx` | 5173 |
| `spec/` | TypeSpec | `main.tsp` (imports `models.tsp`, `owner.tsp`, `guest.tsp`) | — |

- **No database.** Backend uses in-memory `ConcurrentHashMap` — state is lost on restart.
- Vite dev server proxies `/api` → `localhost:8080` (configured in `vite.config.ts`).
- Frontend API client is in `src/api.ts`; models are manually duplicated (no codegen from spec).

## API endpoints (from spec)

**Guest:** `GET /api/guest/event-types`, `GET /api/guest/event-types/{id}/slots`, `POST /api/guest/bookings`
**Owner:** `GET /api/owner/event-types`, `POST /api/owner/event-types`, `PUT /api/owner/event-types/{id}`, `DELETE /api/owner/event-types/{id}`, `GET /api/owner/bookings`

## Commands

```bash
# Backend
cd backend && mvn spring-boot:run           # start server on :8080

# Frontend
cd frontend && npm run dev                   # dev server on :5173
cd frontend && npm run build                 # tsc -b && vite build
cd frontend && npm run lint                  # ESLint flat config
cd frontend && npm run test:e2e              # Playwright e2e (single-worker, serial)
```

## Testing quirks

- **Only e2e tests exist** (no unit or integration tests). They live in `frontend/e2e/`.
- Playwright config: `workers: 1`, `fullyParallel: false` — tests run serially.
- Each test suite **cleans up event types** via the API in `beforeEach` — tests manage their own data.
- Playwright auto-starts Vite dev server (`webServer` config in `playwright.config.ts`).
- E2E test numbers (1–11) are defined in spec filenames (`guest.spec.ts`, `owner.spec.ts`, `navigation.spec.ts`).

## Conventions & quirks

- **TypeScript:** `verbatimModuleSyntax`, `noUnusedLocals`, `noUnusedParameters` are on; `noEmit: true` (Vite handles bundling).
- **ESLint:** Flat config (`eslint.config.js`) with `typescript-eslint`, `react-hooks`, `react-refresh` plugins.
- **CI:** Only the auto-generated `.github/workflows/hexlet-check.yml` — do not modify.
- **React Router:** Uses `react-router-dom` v7 with layout route (`<App>` shell via `<Outlet>`) and three leaf pages: `/` (Home), `/guest`, `/owner`.
- **UI components use Mantine** (`@mantine/core`, `@mantine/hooks`), including `AppShell`, `Modal`, `Table`, `Card`, `Loader`, etc.
- **No formatter config** (prettier, biome, etc.) found in the repo.
