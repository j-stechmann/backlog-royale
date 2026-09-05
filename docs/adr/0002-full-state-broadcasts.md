# 0002. Full-state broadcast synchronization

**Status:** Accepted
**Date:** 2026-04-21 (original decision); documented 2026-09-05

## Context

Clients must agree on room state: who is present, who has voted, what was revealed. Two families of solutions exist: event/delta synchronization (each client applies a stream of small events) or snapshot synchronization (the server broadcasts the complete state after every change).

The original prototype shipped consensus/average results and a state machine with partial updates; cleaning up the backend state management (v0.9.1, "cleaned up backend state management for better stability") settled the question in favor of snapshots.

## Decision

After **every** processed event — register, unregister, evict, or game action — the room serializes its complete state as a single `STATE` JSON message and sends it to every connected client. There are no deltas, no per-client views, no event replay.

## Alternatives

- **Delta/event protocol:** less bandwidth, but every client becomes a state machine that can desync; missed events need resync logic anyway, so you build both systems.
- **Per-client filtered views:** e.g. hiding `hasVoted` counts from non-dealers; rejected as over-engineering — the progress meter is public by design.

## Consequences

- **Good:** self-healing clients (a missed message can never desync anyone — the next event repairs it), trivially testable (serialize one state, compare JSON), a client that reconnects mid-ceremony is instantly consistent.
- **Bad / accepted:** O(n) JSON per event per client. At team sizes (≤ 50) this is noise; at hundreds of players it would warrant deltas or batching (see [Limitations](../architecture/limitations.md)).
- Enabled the client-side reset heuristic ([Frontend](../architecture/frontend.md#derived-state-reset-heuristic)) — state transitions are visible in the snapshot stream, so no dedicated "reset" event was needed.

## References

- `backend/room.go` (`broadcastState`, `broadcastStateLocked`, `RoomState`, `User`)
- [ADR 0005](0005-server-side-vote-secrecy.md) — the one per-view transformation applied to snapshots
- [Architecture: Backend](../architecture/backend.md#state-model)