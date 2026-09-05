# Getting Started

Three ways to run Backlog Royale, from fastest to most involved. For the whys behind the toolchain versions, see [Development setup](../development/setup.md); for deployment hardening, see [Self-hosting](self-hosting.md).

## Prerequisites

| Path | Needs |
| :--- | :--- |
| Docker (recommended) | Docker & Docker Compose |
| Local development | Go **1.27+** and Node.js **26+** |

The versions matter: Go 1.27 is pinned across `backend/go.mod`, CI, and the backend Dockerfile (the [Go version triangle](../adr/0011-go-version-triangle.md)); Node 26 matches the frontend Docker image and the jsdom 30 engine requirement.

## Option 1: Docker Compose (recommended)

```bash
docker-compose up --build
```

| Service | URL | Notes |
| :--- | :--- | :--- |
| Frontend | [http://localhost:8081](http://localhost:8081) | nginx-unprivileged serving static files; container port 8080 mapped to host **8081** |
| Backend | [http://localhost:8080](http://localhost:8080) | Go server; the WebSocket endpoint is `/ws` |

No environment configuration is required on `localhost`: the frontend's WebSocket URL derivation targets `localhost:8080` when running on localhost, which matches the published backend port. Open the frontend URL, pick a room name and a display name, and start voting.

## Option 2: Local development (both halves)

### Backend

```bash
cd backend
go run .
```

The server listens on `http://localhost:8080`. It logs structured JSON to stdout. Run the tests any time:

```bash
go test -v ./...
```

### Frontend

```bash
cd frontend
npm ci          # lockfile-exact install (do not use npm install)
npm run dev
```

Vite serves the dev server (default `http://localhost:5173`). WebSocket connections derive to `ws://localhost:8080` automatically on localhost; to point elsewhere, create `frontend/.env.local`:

```env
VITE_WS_URL=ws://localhost:8080
```

Useful scripts:

| Command | What it does |
| :--- | :--- |
| `npm run dev` | Vite dev server with HMR |
| `npm run test` | Vitest run (all unit tests) |
| `npm run lint` | ESLint over `src` |
| `npm run build` | `tsc -b` + production bundle into `dist/` |

### Verifying the full loop

1. Open the frontend, join a room as **Alice**.
2. Open a second browser window (or profile) at the same URL, join the same room as **Bob**.
3. Both names should appear in each window's player list within a fraction of a second.
4. Have Alice vote `5` and Bob vote `8`; Alice's row shows a green checkmark for both (vote hidden).
5. Reveal: with no dealer in the room, any player can hit **Reveal Results** — both windows show the distribution `1 × 5`, `1 × 8`.

## Option 3: Production-ish single host

Build both images and run them as in Compose, but fronted by a reverse proxy on one origin. This is the deployment shape the frontend's default WebSocket derivation expects. The full walkthrough (proxy config, TLS, non-root ports) is in [Self-hosting](self-hosting.md).

## First contribution?

Read [CONTRIBUTING](../../CONTRIBUTING.md) for the Git Flow workflow and the verification requirements, then [Development setup](../development/setup.md) for the details that bite (Go version triangle, lockfile discipline, test expectations). New features ship with tests — see the [testing strategy](../development/testing.md).