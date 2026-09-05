# 0008. Room eviction via per-room channel

**Status:** Accepted
**Date:** 2026-08-21 (v1.9.0); documented 2026-09-05

## Context

Players switch rooms. The old connection may linger — a half-closed WebSocket that the server has not yet noticed (the read pump only learns of a dead socket after the pong deadline) — leaving a **ghost**: a participant row that still holds a vote, or worse, the dealer seat. Client-side cleanup alone cannot be trusted (the tab may be closed, the network gone), so the server needs a way to evict a specific connection from a room it does not own. The concurrency invariant ([Concurrency model](../architecture/concurrency.md)) says `Room.clients` is owned exclusively by that room's `Run` goroutine — so the Hub cannot simply reach in and delete.

## Decision

The Hub keeps a global **client-ID → room index** (`Hub.index`, its own mutex), maintained by the owning room on every membership change. Eviction is a two-hop handoff:

1. `Hub.EvictClient(id)` looks up the room and posts the ID to that room's `evict` channel — **non-blocking**, so eviction never waits on a busy or dying room.
2. The owning `Room.Run` goroutine processes the eviction like any other event: removes the client, closes its send channel and socket, clears its vote/dealership, disassociates it, and broadcasts.

The frontend triggers this by sending its previous server-assigned ID as `prevId` — but **only on an actual room switch** (tracked via `prevIdToEvict`, cleared on `WELCOME`). Reconnects within the same room and additional tabs in the same room send no `prevId`, so coexisting tabs never evict each other (a v1.9.0 regression fixed within the same release).

## Alternatives

- **Client-side only cleanup:** the original approach; failed when sockets did not close cleanly (the v1.9.0 ghost-client bug, PR #86).
- **Hub reaches into rooms directly (`room.mu`-guarded map):** violates the single-writer invariant; every membership transition would need lock-ordering discipline across three mutexes.
- **Global mutex around all rooms:** serializes the whole server for no benefit at this scale.
- **Send `prevId` on every connection:** simpler frontend, but a second tab would evict the first tab's live connection (shared localStorage ID) — the regression that shaped the current design.

## Consequences

- **Good:** server-side validation independent of client cleanup; works even when the old socket never closes on its own; the ordering caveat (register vs. evict channel readiness under `select`) is analyzed and safe — same-room reconnects hit a dead room (no-op eviction), cross-room switches touch two distinct rooms.
- **Bad / accepted:** a full `evict` channel drops the eviction with a warning (the stale connection is then cleaned up only by its own read pump, up to a pong deadline later); the index adds one more map to keep consistent — it is updated on *every* membership transition, including the slow-client drop path.
- Test infrastructure grew around this: `TestEvictClient`, `TestEvictNonExistentClient`, `TestEvictLastClientClosesRoom`, plus the broadcast-signal waiting helpers ([Testing strategy](../development/testing.md)).

## References

- `backend/hub.go` (`index`, `Associate`, `Disassociate`, `EvictClient`), `backend/room.go` (evict case), `backend/client.go` (`prevId` handling and its ordering comment)
- `frontend/src/hooks/useGameState.ts` (`prevIdToEvict`), `frontend/src/hooks/useBacklogRoyale.ts` (generation counter)
- CHANGELOG v1.9.0 (ghost clients, multi-tab regression), [Architecture: Backend](../architecture/backend.md#identity-and-deduplication)