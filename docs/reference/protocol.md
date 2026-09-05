# WebSocket Protocol Reference

The complete wire format for Backlog Royale's single endpoint. Implementation: `backend/client.go` (upgrade, pumps), `backend/room.go` (state serialization, action handling). The authorization rules behind the actions are in [Game rules](../product/game-rules.md).

## Endpoint

```text
GET /ws?room=<id>&name=<name>[&prevId=<id>]
```

| Parameter | Required | Purpose |
| :--- | :--- | :--- |
| `room` | yes | Room name (= room ID). Creates the room on first join. |
| `name` | yes | Display name. Display-only; not an identity ([ADR 0003](../adr/0003-server-authoritative-identity.md)). |
| `prevId` | no | Previous server-assigned ID to evict. Send **only when switching rooms** — see the multi-tab caveat below. |

- Missing `room` or `name` → HTTP 400 before upgrade.
- `ALLOWED_ORIGIN` ≠ `*` enforces an exact, case-insensitive `Origin` match; an empty `Origin` header is rejected.
- The upgrade response is followed immediately by a `WELCOME` message, then a full `STATE`.

**Message framing:** JSON text frames; outbound buffer 256 messages per client; inbound frames capped at 512 bytes; per-connection rate limit 10 msg/s (burst 20) with excess dropped (server logs a warning, client gets no feedback); server pings every 54 s and enforces a 60 s pong-refreshed read deadline (clients only answer pongs), write deadline 10 s.

## Message catalog

### Server → Client

**`WELCOME`** — sent once, immediately after the upgrade:

```json
{ "type": "WELCOME", "id": "a1b2c3d4e5f60718" }
```

**`STATE`** — full room snapshot, sent after every processed event:

```json
{
  "type": "STATE",
  "id": "engineering-sprint-21",
  "users": [
    { "id": "a1b2c3d4e5f60718", "name": "Alice", "hasVoted": true,              "role": "player" },
    { "id": "f00dcafe01234567", "name": "Bob",   "hasVoted": false,              "role": "player" },
    { "id": "0011223344556677", "name": "Carol", "hasVoted": false,              "role": "dealer" },
    { "id": "0fedcba987654321", "name": "Dave",  "hasVoted": false,              "role": "afk" }
  ],
  "reveal": false,
  "dealerId": "0011223344556677"
}
```

Field notes:

- `vote` is omitted unless `reveal` is `true` — enforced server-side (`getVisibleVote`); hidden votes never cross the wire ([ADR 0005](../adr/0005-server-side-vote-secrecy.md)).
- The dealer and AFK players never carry a `vote` value (the dealer does not vote; AFK clears votes).
- `users` is sorted alphabetically, case-insensitive.
- `dealerId` is `""` when the room has no dealer (dealer-free mode).

### Client → Server

Actions are processed one at a time by the room's event loop; every accepted action results in a `STATE` broadcast.

| Action | Payload | Authorization | Effect |
| :--- | :--- | :--- | :--- |
| `VOTE` | `{ "vote": "5" }` | Players only | Records the vote if it is one of `1 2 3 5 8 13 21 ? A`; otherwise ignored (previous vote kept) |
| `REVEAL` | — | Dealer, or any non-AFK player when no dealer exists | `reveal = true`; real votes now included in `STATE` |
| `RESET` | — | Dealer, or any non-AFK player when no dealer exists | `reveal = false`; all votes cleared |
| `TOGGLE_ROLE` | — | Any client | Player→dealer (demoting current dealer, clearing own vote) or dealer→player |
| `TOGGLE_AFK` | `{ "userId": "<id>" }` (optional) | Self always; dealer may send others AFK | Toggle AFK state; un-AFK is self-only |

Wire examples:

```json
{ "type": "VOTE", "vote": "5" }
{ "type": "REVEAL" }
{ "type": "RESET" }
{ "type": "TOGGLE_ROLE" }
{ "type": "TOGGLE_AFK" }
{ "type": "TOGGLE_AFK", "userId": "f00dcafe01234567" }
```

**Identity fields are decorative:** the server binds every action to the connection's own ID and the `name` from the query string. A client-declared `name` inside an action is ignored; `userId` is honored only for the dealer's AFK-targeting (permission-checked) ([ADR 0003](../adr/0003-server-authoritative-identity.md)).

**Error handling:** there is no error message type in the protocol. Invalid JSON is logged and dropped; unauthorized or invalid actions are dropped (server-side log only) and the next `STATE` re-asserts reality. Hard failures exist only at the handshake: **HTTP 400** (missing `room`/`name`), **403** (origin rejected when `ALLOWED_ORIGIN` is set), or **429** (per-IP HTTP rate limit exhausted).

## Sequence: a full round

```text
Client                          Server (Room goroutine)
  │── ws upgrade (room, name) ──►│
  │◄────────── WELCOME ──────────│  id assigned
  │◄────────── STATE ────────────│  initial snapshot
  │── VOTE "5" ─────────────────►│
  │◄────────── STATE ────────────│  hasVoted: true (vote hidden)
  │── REVEAL ───────────────────►│  (authorized client)
  │◄────────── STATE ────────────│  reveal: true, votes visible
  │── RESET ────────────────────►│
  │◄────────── STATE ────────────│  reveal: false, votes cleared
```

## Sequence: room switch with `prevId`

```text
Client (was in room A)          Server
  │── ws upgrade (room B, prevId=<id-in-A>) ──►│
  │                                            ├─ Room B: register, WELCOME, STATE
  │                                            └─ Room A: evict <id> (ghost removed, vote/dealer cleared, STATE)
  │◄────────── WELCOME (new id) ───────────────│
```

Ordering caveat: `register` (room B) and `evict` (room A) are independent channels of independent rooms; their relative order is not guaranteed and does not matter. See [ADR 0008](../adr/0008-eviction-via-room-channel.md).

## Transport guarantees

- **Ordering:** per-connection FIFO (WebSocket); cross-connection ordering is defined by the room event loop's processing order, not by arrival order.
- **At-least-once semantics:** none — messages are delivered live only. A client that cannot keep up is dropped (send buffer 256) and reconnects; the next `STATE` makes it consistent ([ADR 0002](../adr/0002-full-state-broadcasts.md)).
- **Keepalive:** clients must answer pings within 60 s or the connection is dropped and cleaned up by the server's unregister path.