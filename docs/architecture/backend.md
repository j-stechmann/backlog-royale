# Backend Architecture

The backend lives in `/backend` as a single Go module (`github.com/j-stechmann/backlog-royale`) with exactly two external dependencies: `github.com/gorilla/websocket` and `golang.org/x/time` (rate limiting). Logging is structured JSON via `log/slog`.

## File map

| File | Responsibility |
| :--- | :--- |
| `main.go` | Config from env, JSON logger, `/ws` route, security middleware (per-IP rate limit + security headers), `http.Server` timeouts. |
| `hub.go` | Registry of active rooms plus a global client-ID → room index used for eviction. |
| `room.go` | Room state, the per-room event loop, action handling, state broadcasting. |
| `client.go` | Per-connection read/write pumps, ping/pong keepalive, per-connection message rate limiter, `serveWs` upgrade handler. |
| `constants.go` | Role, action, and message-type string constants shared by both sides of the wire. |
| `room_test.go` | Game-rule and lifecycle tests (see [Testing strategy](../development/testing.md)). |

## The three types

### Hub

```go
type Hub struct {
    rooms map[string]*Room   // guarded by mu (RWMutex)
    index map[string]*Room   // client-ID → room, guarded by idxMu
}
```

- `GetOrCreateRoom(id)`: returns an existing room or creates one, starts its `Run` goroutine, and stores it. Rooms are *named*, not allocated: the room name from the URL *is* the ID.
- `RemoveRoom(id)`: deletes from the map. Called only by a room's own event loop when the room empties.
- `Associate` / `Disassociate`: maintain the client-ID index. Called from the room's event loop on register/unregister/evict and from the slow-client drop path.
- `EvictClient(id)`: looks up the room holding a client ID and posts a non-blocking eviction to that room's `evict` channel (see [ADR 0008](../adr/0008-eviction-via-room-channel.md)). Used to remove ghost connections on room switches.

### Room

```go
type Room struct {
    ID           string
    clients      map[string]*Client // keyed by server-assigned ID; owned by Run
    participants map[string]string  // player ID -> vote ("" = not voted)
    isRevealed   bool
    dealerID     string
    // channels: register, unregister, evict, broadcast
}
```

Game state (`participants`, `isRevealed`, `dealerID`) is guarded by `Room.mu`. Membership (`clients`) is *not* guarded by it — it is owned exclusively by the `Run` goroutine. The full rules are in [Concurrency model](concurrency.md).

Only **players** appear in `participants`. The dealer does not vote; AFK players are removed; the "A" (Abstain) card **is** stored as a vote and counts toward `HasVoted`. Users are sorted alphabetically (case-insensitive) in every broadcast.

### Client

A wrapper around one WebSocket connection: `ID` (server-generated), `name` (from the query string), `role`, a 256-buffer `send` channel, and a per-connection `rate.Limiter` (10 msg/s, burst 20). Two goroutines per client:

- `readPump`: reads frames (512-byte cap), refreshes the 60 s read deadline on pong, rate-checks each message, and forwards valid payloads to the room's `broadcast` channel (non-blocking).
- `writePump`: serializes outbound messages, batches per frame, pings every 54 s, honors a 10 s write deadline.

## State model

```go
type RoomState struct {
    Type     string `json:"type"`      // always "STATE"
    ID       string `json:"id"`        // room ID
    Users    []User `json:"users"`
    Reveal   bool   `json:"reveal"`
    DealerID string `json:"dealerId"`
}

type User struct {
    ID       string `json:"id"`
    Name     string `json:"name"`
    HasVoted bool   `json:"hasVoted"`
    Vote     string `json:"vote,omitempty"` // stripped unless revealed
    Role     string `json:"role"`           // player | dealer | afk
}
```

**Vote secrecy is enforced here:** `getVisibleVote` returns the real vote only while `isRevealed` is true. The server never transmits hidden votes, so they cannot be leaked from devtools ([ADR 0005](../adr/0005-server-side-vote-secrecy.md)).

Action handling is a single `switch` over the typed `ActionMessage` under `r.mu`; every action ends with `broadcastStateLocked()`. There is no error channel back to clients — invalid or unauthorized actions are dropped with a server-side log, and the next `STATE` re-asserts reality. The rules each handler enforces are in [Game rules](../product/game-rules.md).

## Identity and deduplication

- IDs are generated **server-side** per connection: 8 bytes from `crypto/rand`, hex-encoded (16 characters). Client-supplied IDs are never trusted ([ADR 0003](../adr/0003-server-authoritative-identity.md)).
- The frontend stores the most recently assigned ID in `localStorage` (`backlog_royale_id`). This is a convenience value, **not** an auth token — it is only ever sent back as the optional `prevId` query parameter.
- **Same-ID registration dedup (defensive):** if a client registers with an ID already present in the room, the old connection's send channel and socket are closed and the new one takes its place. Production traffic never hits this path — `serveWs` unconditionally mints a fresh ID per connection — so ordinary reconnects create a new participant row and the stale one disappears when the dead socket's `unregister` is processed. Dedup exists as a safety net for direct/test registration and against any future code path that re-uses an ID.
- The `unregister` handler only removes a client if `r.clients[id]` is still that exact client pointer, so a stale unregister from a replaced/evicted socket cannot remove the live connection.
- **Room switching (`prevId`):** when a client joins a different room it sends its previous server-assigned ID as `prevId`. `Hub.EvictClient` finds the room still holding that ID and posts an eviction to that room's `evict` channel; the owning goroutine removes the ghost (closing its socket), clears its vote/dealership, and broadcasts. This works even if the old WebSocket has not fully closed yet, and it is server-side validation independent of client cleanup ([ADR 0008](../adr/0008-eviction-via-room-channel.md)).
- **Ordering caveat** (documented at `client.go`): `register` and `evict` are both buffered channels and `select` picks among ready cases pseudo-randomly, so their relative order is not guaranteed. In practice this is safe: same-room reconnects happen after the old room has already torn down (eviction is a no-op), and cross-room transitions are order-independent because old and new rooms are distinct.
- **Multi-tab caveat:** `prevId` is sent *only* on an actual room switch — tracked in `useGameState` via a `prevIdToEvict` field set from the pre-switch ID and cleared once the new connection's `WELCOME` arrives. Reconnects within the same room and additional tabs in the same room send no `prevId`, so coexisting tabs keep their vote/dealer state. Note the form-join exception: `prevIdToEvict` is also set when a tab submits the join form, so a second tab joining via the join form (rather than the room URL) forwards the shared localStorage ID and evicts the first tab's live connection, which then reconnects with a fresh identity.

## HTTP layer

`main.go` is intentionally boring:

- **Routes:** exactly one, `/ws`.
- **Security middleware** wraps everything: per-IP token-bucket rate limiting (1 req/s, burst 10, via a `sync.Map` of limiters; 429 on excess) and a set of security headers. The backend serves no HTML, so the headers (`X-Frame-Options`, CSP, etc.) are defense-in-depth for anything that ever gets added. Full details in [Security](security.md).
- **Server timeouts:** ReadHeader 5 s, Read 10 s, Write 10 s, Idle 120 s. These govern the HTTP handshake; after the upgrade hijacks the connection, the client-level deadlines in `client.go` take over.
- **Config:** `PORT` (default `8080`) and `ALLOWED_ORIGIN` (default `*`, must be restricted in production) — see [Configuration](../reference/configuration.md).

## Lifecycle

1. `main.go` starts the server; `Hub` is created empty.
2. First client for a room name → `GetOrCreateRoom` → room goroutine starts.
3. Clients come and go via channels; every membership change triggers a full state broadcast.
4. When an event leaves the room empty, the event loop calls `RemoveRoom` and returns — the goroutine's exit *is* the teardown. There is no shutdown signal, no persistence, no graceful-drain step.

See [Concurrency model](concurrency.md) for the channel protocol and [Limitations](limitations.md) for what this lifecycle does not attempt (draining, persistence, horizontal scaling).