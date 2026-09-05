# Configuration Reference

Every knob in Backlog Royale, in one place. Backend variables are read in `backend/main.go`; frontend variables are Vite env vars consumed in `frontend/src/hooks/useBacklogRoyale.ts`.

## Backend (Go)

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `8080` | The port the server listens on. |
| `ALLOWED_ORIGIN` | `*` | Allowed CORS origin for the WebSocket upgrade. Use `*` for development or a specific domain (e.g. `https://poker.example.com`) for production. Any other value enables a strict, case-insensitive `Origin` check; an empty `Origin` header is rejected. |

That is the complete list — there is no config file, no flags, no secret store. The configuration philosophy is "env vars only, parsed in `loadConfig()`". Future enhancements tracked in the original configuration plan: `.env` support (`godotenv`), a `LOG_LEVEL` knob, persistence-layer configuration (Redis/Postgres URL) — see [Limitations](../architecture/limitations.md).

## Frontend (React/Vite)

| Variable | Default | Description |
| :--- | :--- | :--- |
| `VITE_WS_URL` | *(derived at runtime)* | The full WebSocket base URL of the backend (e.g. `wss://poker.example.com`). If unset, the client derives it: `wss/ws://` + current host, with `localhost:8080` assumed on `localhost` so local Docker Compose works without configuration. |

Important properties:

- `VITE_*` variables are **baked into the bundle at build time**. Setting them via runtime env in a deployed container does nothing; rebuild the image (or rely on the default derivation, which is what the Docker setup does — the frontend image contains no runtime configuration).
- The default derivation means the production expectation is a **reverse proxy** that routes `/ws` (and `/`) to the backend/frontend respectively on one origin — see [Self-hosting](../guides/self-hosting.md).

### Development

Create `frontend/.env.local` (gitignored):

```env
VITE_WS_URL=ws://localhost:8080
```

For the Docker Compose workflow no env file is needed: on `localhost` the client targets `localhost:8080` by default, which is the backend's published port.

## Browser storage (localStorage)

| Key | Values | Purpose |
| :--- | :--- | :--- |
| `backlog_royale_name` | any string | Display name; enables one-click rejoin |
| `backlog_royale_id` | 16-hex-char server-assigned ID | Last assigned ID; used only as `prevId` on room switches. **Not a credential** ([ADR 0003](../adr/0003-server-authoritative-identity.md)) |
| `backlog_royale_theme` | `light` \| `dark` \| `system` | Theme mode; invalid values normalize to `system` |

## Content-Security-Policy note

The theme's pre-paint script is an **inline `<script>` in `frontend/index.html`** (deliberate: it must run before any bundle loads to avoid a flash of the wrong theme — see [ADR 0009](../adr/0009-semantic-tokens-and-dark-theme.md)). If you deploy with a strict CSP header, allow inline scripts (or add a nonce) so the script can run; otherwise the site loads unthemed and flashes.

## Security best practices for deployment

1. **Never commit `.env` files.** They are included in `.gitignore`.
2. **Restrict CORS.** In production, set `ALLOWED_ORIGIN` to the frontend's origin; `*` accepts upgrades from any origin.
3. **Use WSS.** Terminate TLS at your proxy and serve the app under `https://`, so the client derives `wss://` — or set `VITE_WS_URL=wss://…` explicitly at build time.
4. **Rate limiting behind proxies:** the per-IP limiter keys on `RemoteAddr`. Behind a proxy, either preserve client IPs (PROXY protocol / `X-Forwarded-For` handling) or accept that all clients share one bucket — see [Security](../architecture/security.md#what-is-out-of-scope).

## Where values are read

| Setting | Read at | File |
| :--- | :--- | :--- |
| `PORT`, `ALLOWED_ORIGIN` | process start | `backend/main.go` (`loadConfig`) |
| `VITE_WS_URL` | **build time** | `frontend/src/hooks/useBacklogRoyale.ts` (`import.meta.env`) |
| Theme / name / ID | runtime, per browser | `frontend/src/hooks/useTheme.ts`, `useGameState.ts` |