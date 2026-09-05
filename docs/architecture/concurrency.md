# Concurrency Model

How the backend stays race-free without heavy locking: **every piece of mutable room state has exactly one owner**, and everyone else talks to that owner through channels.

## The core rule

> `Room.clients` is owned exclusively by that room's `Run` goroutine. No other goroutine ever reads or mutates it.

Everything that must affect room membership is routed through a channel and processed by the event loop:

| Channel | Buffer | Carries | Produced by |
| :--- | :--- | :--- | :--- |
| `register` | 16 | `*Client` | `serveWs` (new connection) |
| `unregister` | 64 | `*Client` | `readPump` defer (disconnect) |
| `evict` | 64 | `string` (client ID) | `Hub.EvictClient` (room switch) |
| `broadcast` | 64 | `ClientMessage` | `readPump` (VOTE, REVEAL, …) |

The event loop processes **one case per iteration** and then checks `len(r.clients) == 0`; an empty room removes itself from the Hub and its goroutine exits.

## Lock layout

| Data | Guard | Notes |
| :--- | :--- | :--- |
| `Hub.rooms` | `Hub.mu` (`sync.RWMutex`) | Get/create/remove; creation also spawns the goroutine |
| `Hub.index` (client-ID → room) | `Hub.idxMu` (`sync.Mutex`) | Separate mutex so index churn never contends room lookup |
| `Room.participants`, `isRevealed`, `dealerID` | `Room.mu` | Held during `handleAction` and `broadcastStateLocked` |
| `Room.clients` | *none — goroutine ownership* | Only `Run` touches it; tests never read it (see [Testing strategy](../development/testing.md)) |
| `Client.send` | channel semantics | Closed by the owner when the client is removed |
| `ipLimiters` | `sync.Map` | One rate limiter per IP |

## Non-blocking sends, everywhere

Every send into a room channel is a `select` with a `default` branch, so a busy or exiting room can never block a client pump or the HTTP handler:

- `readPump` → `broadcast`: full channel drops the message **with a warning log**. Before v1.9.0 this drop was silent, which made lost votes nearly impossible to diagnose.
- `readPump` defer → `unregister`: full channel logs a warning. A dropped unregister would silently leak a ghost client, preventing room teardown on mass disconnects exceeding the buffer.
- `serveWs` → `register`: full channel closes the just-upgraded connection rather than queueing it.
- `Hub.EvictClient` → `evict`: full channel logs and gives up; the stale connection is eventually cleaned up by its own read pump when the socket dies.

The buffers (16/64/64/64) are sized for human-paced ceremonies; a burst larger than 64 concurrent actions in one event-loop iteration indicates either abuse (caught by the message rate limiter) or a pathological client.

## Backpressure: drop the client

If a client's outbound channel (buffered, 256) is full when the room broadcasts state, `broadcastStateLocked` treats the client as dead: it closes the send channel, removes it from the room, and disassociates it from the Hub index.

- **Chosen over:** blocking the room (one slow client freezes the ceremony) or unbounded queueing (memory exhaustion).
- **Cost:** a client on a flaky network is dropped mid-session; the frontend's 3-second reconnect brings it back with a fresh identity. Acceptable because reconnect is cheap and membership cleanup is automatic.

## The eviction handoff (ADR 0008)

Room switches must remove ghost connections, but the Hub must not touch another room's `clients` map. The handoff:

```text
serveWs (new room B)          Hub.EvictClient(prevID)         Room A.Run()
     │                                 │                              │
     ├─ register(new) to Room B        ├─ index lookup                │
     │                                 ├─ Room A.evict <- prevID      │
     │                                 └─ (non-blocking)              ├─ case evict:
     │                                                                │   delete clients[id]
     │                                                                │   close send + conn
     │                                                                │   clear vote/dealer
     │                                                                │   Disassociate
     │                                                                └─ broadcastState
```

The register/evict ordering caveat: both are buffered channels and `select` picks among ready cases pseudo-randomly, so their relative order is not guaranteed. Analysis (documented at `client.go`): same-room reconnects happen after the old room has already torn down (eviction is a no-op), and cross-room transitions are order-independent because old and new rooms are distinct.

## Teardown

There is no shutdown signal and no graceful-drain step: the event loop's empty-room check *is* the teardown. When the last client leaves (via any path — unregister, evict, slow-client drop), the loop removes the room from the Hub and returns, letting the goroutine exit. Two properties fall out of this:

- **No leak:** rooms cannot outlive their last participant, even if the process runs for weeks.
- **No persistence:** a process restart loses everything (accepted, [ADR 0001](../adr/0001-in-memory-state.md)).

## Goroutine inventory

For a deployment with *R* rooms and *C* clients:

- 1 main goroutine (HTTP accept loop)
- R room event loops (`Room.Run`)
- 2C client goroutines (`readPump` + `writePump`)

All short-lived and unbuffered; there are no pools, no worker queues, no tickers beyond the per-client ping ticker.

## Known sharp edges

- **Shared `upgrader.CheckOrigin`** is reassigned per request on the shared upgrader value. Functionally correct with a single configured origin, but not goroutine-safe by the letter of the Gorilla docs; pinning one origin per deployment avoids the issue in practice. Listed in [Limitations](limitations.md).
- **`waitForCondition` in tests** polls under `r.mu` — it can read `participants`/`dealerID` but must never read `r.clients`, which belongs to the `Run` goroutine. The test helper's doc comment encodes this ([Testing strategy](../development/testing.md)).
- The `-race` detector is exercised manually, not in CI (plain `go test` there); see [Testing strategy](../development/testing.md).