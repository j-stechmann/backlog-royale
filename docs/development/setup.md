# Development Setup

The precise toolchain, the commands, and the pitfalls that are easy to trip over. For a quick start see [Getting started](../guides/getting-started.md); for the branching model see [CONTRIBUTING](../../CONTRIBUTING.md).

## Toolchain versions (and why they are pinned)

| Tool | Version | Where pinned |
| :--- | :--- | :--- |
| Go | **1.27.x** | `backend/go.mod` (`go 1.27.0`), `ci.yml` (`go-version: '1.27.x'`), `backend/Dockerfile` builder (`golang:1.27.0-alpine3.23`) |
| Node.js | **26** | `ci.yml` (`node-version: 26`), `frontend/Dockerfile` builder (`node:26.8.1-alpine3.23`); jsdom 30 requires `>=26`-compatible Node (its range also permits 22/24, so the CI/Docker pins are the enforcement) |

**Go version triangle:** the three Go pins must be bumped *together, by hand*. Dependabot ignores every version update of the `go` directive — a mismatch would silently download a different toolchain via `GOTOOLCHAIN=auto` and desynchronize CI from the Docker build. The full story is [ADR 0011](../adr/0011-go-version-triangle.md).

## Backend

```bash
cd backend
go build ./...        # compile check
go test -v ./...      # tests (the CI gate)
go test -race ./...   # race verification (manual — CI runs plain go test)
go fmt ./...          # formatting before committing
```

Dependencies are minimal by design (`gorilla/websocket`, `golang.org/x/time`). `go mod tidy` must leave `go.mod` unchanged after your change — a diff there means an undeclared or unused dependency.

## Frontend

```bash
cd frontend
npm ci                # always ci, never install — lockfile-exact
npm run dev           # Vite dev server
npm run test          # Vitest, single run (the CI gate)
npm run lint          # ESLint (the CI gate)
npm run build         # tsc -b + vite build
```

- **Never edit `package-lock.json` by hand.** Routine bumps come from grouped Dependabot PRs ([Dependency management](dependencies.md)); security bumps arrive as individual PRs. If you must add a dependency, do it in one commit with a regenerated lockfile and a rationale in the PR description.
- `package.json` carries the **frontend app version** — the release process bumps it ([Release process](release-process.md)), and the UI footer displays it via `__APP_VERSION__`.

## Environment variables

| Where | Variable | Local value |
| :--- | :--- | :--- |
| backend | `PORT` | unset (8080) |
| backend | `ALLOWED_ORIGIN` | unset (`*`) — fine for local dev |
| frontend | `VITE_WS_URL` | unset — localhost derivation targets `localhost:8080` |

Details and the CSP caveat for the theme's inline script: [Configuration reference](../reference/configuration.md).

## Full verification before any PR

The project's "laws" ([CONTRIBUTING](../../CONTRIBUTING.md)) require all of these to pass:

```bash
# backend
cd backend && go test -v ./...

# frontend
cd frontend && npm run test && npm run lint
```

CI additionally runs `npm run build` and a Docker build of both images (the `docker` job) — a PR that passes locally but breaks the Docker build will be caught there. Local repro:

```bash
docker build backend/ && docker build frontend/
```

## Pitfalls that actually bite

1. **The Go triangle** — bumping `go.mod` alone breaks CI's version match; bump all three places ([ADR 0011](../adr/0011-go-version-triangle.md)).
2. **`npm install` instead of `npm ci`** — produces a lockfile drift that fails CI's `npm ci`; always `npm ci` locally too.
3. **Reading `r.clients` from backend tests** — the map is owned by the room's goroutine; tests must use the broadcast/condition helpers ([Testing strategy](testing.md)).
4. **Sending `prevId` on every connection** — would make second tabs evict first tabs; the `prevIdToEvict` lifecycle in `useGameState` exists precisely to prevent this ([ADR 0008](../adr/0008-eviction-via-room-channel.md)).
5. **Hardcoded URLs in the frontend** — the laws forbid it; use `import.meta.env` / runtime derivation ([Configuration](../reference/configuration.md)).
6. **`fmt.Printf`/`log` in Go code** — structured `log/slog` JSON only; the log catalog is in [Logging](../operations/logging.md).
7. **Docker base-image tags** — always version-pinned, never `latest` or floating tags; Dependabot bumps them weekly and CI's `docker` job validates the build ([ADR 0010](../adr/0010-dependency-automation.md)).

## Working on the docs

Documentation lives in `docs/` with a [map](../README.md). Rules of thumb: update `CHANGELOG.md` with every change; keep service READMEs short; write an ADR when you make or change a decision; link relatively. The complete checklist is in [CONTRIBUTING → Documentation](../CONTRIBUTING.md#6-documentation).