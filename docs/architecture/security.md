# Security Model

What the application protects, how, and — just as importantly — what it does not. The threat model is "trusted team, possibly untrusted network"; the deployment story is "you own the host".

## Layers

| Layer | Mechanism | Parameters | Code |
| :--- | :--- | :--- | :--- |
| HTTP rate limiting | Per-IP token bucket | 1 req/s, burst 10; 429 on excess | `main.go` (`getIPLimiter`, `securityMiddleware`) |
| WS message rate limiting | Per-connection token bucket | 10 msg/s, burst 20; excess dropped + logged | `client.go` (`readPump`) |
| Message size | `SetReadLimit` | 512 bytes | `client.go` |
| Keepalive | Ping/pong + deadlines | 60 s read deadline (pong-refreshed), ping every 54 s, 10 s write deadline | `client.go` |
| Origin check | `upgrader.CheckOrigin` | Exact, case-insensitive match when `ALLOWED_ORIGIN` ≠ `*`; empty `Origin` rejected | `client.go` (`serveWs`) |
| Security headers | Middleware | `nosniff`, `DENY`, XSS filter, `no-referrer`, CSP (`default-src 'self'; connect-src 'self' ws: wss:`) | `main.go` |
| Server timeouts | `http.Server` | ReadHeader 5 s, Read 10 s, Write 10 s, Idle 120 s (handshake only) | `main.go` |
| Identity | Server-generated IDs | 8 bytes `crypto/rand`, hex; client IDs never trusted | `client.go` (`generateID`) |

Notes:

- The rate limiters are **per-IP, in-memory, and unbounded**: one `sync.Map` entry per unique IP for the lifetime of the process. Behind a small or proxied deployment this is fine; at internet scale it is a slow memory leak (see [Limitations](limitations.md)).
- The server headers are defense-in-depth: the backend serves no HTML — only the WebSocket upgrade.
- The HTTP-level timeouts govern the handshake; after the upgrade hijacks the connection, the client-level deadlines above take over.

## Vote secrecy

Votes are hidden **server-side** until a reveal: `getVisibleVote` strips the vote value from every broadcast unless `isRevealed` is true. A user with devtools open cannot read other players' votes by inspecting WebSocket frames — only `hasVoted` flags are visible before the reveal. This is why the secrecy check lives in the serializer rather than the UI ([ADR 0005](../adr/0005-server-side-vote-secrecy.md)).

What secrecy does *not* cover:

- **Vote immutability:** the server accepts votes from any player at any time (role-checked only). The UI blocks voting after a reveal; a client bypassing the UI can change a vote while `reveal = true` and the changed value is broadcast immediately. See [Game rules → Known gaps](../product/game-rules.md#known-gaps-between-ui-and-server-enforcement).
- **Early reveal:** the UI gates Reveal until all players have voted; the server checks role, not completeness.

## Identity

- Every connection gets a fresh 16-character random ID minted from `crypto/rand`. There is no way to claim someone else's identity, and no long-lived credential to steal — the localStorage ID is a routing hint (`prevId`), not a credential ([ADR 0003](../adr/0003-server-authoritative-identity.md)).
- Action messages carry **no trusted identity fields**: the server uses the connection's own ID and the `name` from the query string. A client-declared `name` inside an action payload is ignored.
- Consequence: identity is per-connection. A reconnect gets a new ID (the old row is cleaned up when the dead socket is noticed). Anyone who can guess or obtain a room name can join it — room membership is not a secret (see [Limitations](limitations.md)).

## What is out of scope

Deliberate non-goals for a team-sized tool — each with its rationale in [ADR 0001](../adr/0001-in-memory-state.md) / [ADR 0006](../adr/0006-dealer-role-and-no-dealer-fallback.md) or [Limitations](limitations.md):

- **Authentication / accounts** — friction without a matching threat.
- **Room passwords / ACLs** — the room name is the capability.
- **Moderation beyond role mechanics** — no bans, no kicks (the AFK control is the closest analog).
- **Rate limiting behind proxies** — limiters key on `RemoteAddr`, so a reverse proxy must pass through/forward real IPs or everyone shares one bucket.
- **TLS** — terminated at the proxy; use `wss://` in production (see [Configuration](../reference/configuration.md) and [Self-hosting](../guides/self-hosting.md)).

## Reporting issues

Security-relevant bugs (e.g. vote leakage, identity confusion) can be filed as regular GitHub issues — there is no private disclosure channel for this project; weigh that when sharing exploit details publicly.