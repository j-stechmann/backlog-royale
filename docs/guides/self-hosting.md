# Self-Hosting Guide

How to run Backlog Royale for real: images, ports, reverse proxy, TLS, and upgrades. For local experimentation, [Getting started](getting-started.md) is enough.

## Images

Two images are published to GHCR on every release ([CI/CD](../operations/ci-cd.md)):

```text
ghcr.io/j-stechmann/backlog-royale/backend:<version>
ghcr.io/j-stechmann/backlog-royale/frontend:<version>
```

Tags follow semver patterns (`1.9.2`, `1.9`, `1`) plus the commit SHA and branch refs. Both images are **multi-stage, version-pinned, and non-root**:

| | Build | Runtime | Runs as | Port |
| :--- | :--- | :--- | :--- | :--- |
| Backend | `golang:1.27.0-alpine3.23` → `CGO_ENABLED=0` static binary | `alpine:3.24.1` | dedicated `appuser` | 8080 |
| Frontend | `node:26.8.1-alpine3.23` → `npm ci` + `npm run build` | `nginxinc/nginx-unprivileged:1.31.4-alpine3.24` | nginx-unprivileged (uid 101) | 8080 |

The frontend image serves **static files only** — it contains no proxy logic and no runtime configuration. `VITE_WS_URL` is baked at build time if set; otherwise the client derives the WebSocket URL at runtime (see [Configuration](../reference/configuration.md)).

## The deployment shape that just works

One origin, one TLS termination, path-split routing:

```text
                    ┌────────────┐
browser ── https ──►│  reverse   │── /            ──► frontend (static)
                    │  proxy     │── /ws (upgrade) ──► backend :8080
                    └────────────┘
```

With this shape the frontend's default URL derivation (`wss://<same-host>/ws`) connects correctly with zero build-time configuration. Set `ALLOWED_ORIGIN=https://<your-domain>` on the backend.

### nginx example

```nginx
server {
    listen 443 ssl;
    server_name poker.example.com;
    # certificates omitted

    location /ws {
        proxy_pass http://backend:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 3600s;   # beyond the server's 60s pong window
        proxy_send_timeout 3600s;
    }

    location / {
        proxy_pass http://frontend:8080;
    }
}
```

Critical details:

- **Upgrade headers are mandatory** for `/ws`; without them the handshake fails.
- **Idle proxies kill WebSockets.** The **server** sends pings every 54 s and enforces the pong deadline: a connection that does not answer within 60 s is closed (browsers answer server pings automatically; clients cannot originate WebSocket pings). Proxies with shorter read timeouts (nginx defaults to 60 s) can kill the connection first anyway — raise `proxy_read_timeout` as above; the server's periodic pings keep the proxy→backend leg alive. A killed connection is *survivable* (3-second reconnect) but avoidable.
- **Real client IPs:** the backend rate-limits per `RemoteAddr`. Without PROXY protocol or real-IP handling, all clients share one bucket — see [Configuration](../reference/configuration.md#security-best-practices-for-deployment).

### Caddy example

```caddy
poker.example.com {
    handle /ws {
        reverse_proxy backend:8080
    }
    handle {
        reverse_proxy frontend:8080
    }
}
```

Caddy handles the upgrade headers and TLS automatically.

## Environment

| Container | Variable | Recommended |
| :--- | :--- | :--- |
| backend | `PORT` | `8080` (container-internal; map/proxy freely) |
| backend | `ALLOWED_ORIGIN` | your frontend origin, e.g. `https://poker.example.com` |
| frontend | `VITE_WS_URL` | unset (rely on same-origin derivation) or set at **build time** |

## Docker Compose (production shape)

The repository's `docker-compose.yml` is the *development* shape (frontend on host 8081, backend on 8080, no TLS). A production Compose file differs in three ways:

```yaml
services:
  backend:
    image: ghcr.io/j-stechmann/backlog-royale/backend:1.9.2
    environment:
      ALLOWED_ORIGIN: https://poker.example.com
    # no host ports needed if the proxy reaches the compose network

  frontend:
    image: ghcr.io/j-stechmann/backlog-royale/frontend:1.9.2

  proxy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
```

1. **Pin image versions** (tags from GHCR) instead of `build:` — reproducible deploys.
2. **Set `ALLOWED_ORIGIN`** to the real origin; `*` is dev-only.
3. **Terminate TLS at the proxy** and serve one origin as above.

## Upgrades

1. **Expect data loss.** Rooms live in the backend process's memory ([ADR 0001](../adr/0001-in-memory-state.md)) — a restart wipes active sessions. Schedule restarts between ceremonies; announce it.
2. Check the [CHANGELOG](../../CHANGELOG.md) for behavior changes; majors are manually reviewed by design ([ADR 0010](../adr/0010-dependency-automation.md)).
3. Pull the new tags, `docker compose up -d`, and verify: open the app, join a room from two windows, vote, reveal.
4. Watch the backend logs (structured JSON) for `Server starting` and absence of warnings — see [Logging](../operations/logging.md).

## Health and observability

- There is no dedicated health endpoint. `GET /ws` without the upgrade returns 400 — a TCP connect plus an HTTP read is a sufficient liveness check.
- Connection state per client is visible in the UI (`Live` / `Reconnecting...`).
- Logs are JSON on stdout with rooms/clients as structured fields; wire them into your log stack — see [Logging](../operations/logging.md) for the event catalog and [Troubleshooting](../operations/troubleshooting.md) for symptom → fix.

## Capacity expectations

- Rooms are O(n) on broadcast; a team-sized room (≤ 50) is trivial. Hundreds of players per room would need design changes ([Limitations](../architecture/limitations.md)).
- The backend is a single process: one core is enough for normal use; memory scales with room/player count (small structs + 256-message buffers per client).
- Per-IP rate limiting (1 req/s, burst 10) applies at the HTTP layer — a busy proxy in front with shared IPs can bump into 429s; see the real-IP note above.