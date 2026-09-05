# 0004. JSON over WebSocket protocol

**Status:** Accepted
**Date:** 2026-04-21 (original decision); documented 2026-09-05

## Context

One bidirectional transport is needed for room events. Payloads are small and simple: actions with at most one string field, snapshots with a list of users. The choice is less about capability and more about debuggability, typing discipline, and ecosystem fit on both the Go and React sides.

## Decision

All communication is JSON text frames over a single WebSocket endpoint (`/ws`), with strictly typed structs on the backend (`ActionMessage`, `RoomState`, `User`, `WelcomeMessage`) and mirrored TypeScript interfaces in the frontend. Message types are string constants (`STATE`, `WELCOME`, `VOTE`, `REVEAL`, `RESET`, `TOGGLE_ROLE`, `TOGGLE_AFK`) duplicated in `backend/constants.go` and `frontend/src/constants.ts`.

## Alternatives

- **Binary protocol (protobuf/msgpack):** smaller frames, but unreadable in devtools — for a debugging-friendly team tool, human-readable frames won outright.
- **REST + SSE:** simpler HTTP semantics, but reveal/reset need low-latency bidirectionality and SSE's one-way model would double the endpoints.
- **graphql subscriptions / socket.io:** heavy dependencies for one endpoint's worth of traffic; socket.io also brings its own framing dialect that fights plain WebSocket tooling.

## Consequences

- **Good:** frames are human-readable in devtools and `wscat`; Go structs ↔ TS interfaces diff cleanly in review; the 512-byte read limit is generous for JSON of this shape.
- **Bad / accepted:** constant strings on both sides can drift — mitigated by the paired `constants` files and the type-checked frontend; JSON is verbose (irrelevant at snapshot sizes, see [ADR 0002](0002-full-state-broadcasts.md)).
- The project "laws" make the typing discipline explicit: no `map[string]interface{}` anywhere in the wire path ([Coding standards](../development/standards.md)).

## References

- `backend/room.go`, `backend/client.go`, `backend/constants.go`
- `frontend/src/constants.ts`, `frontend/src/hooks/useBacklogRoyale.ts`
- Full wire format: [Protocol reference](../reference/protocol.md)