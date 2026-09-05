# 0003. Server-authoritative identity

**Status:** Accepted
**Date:** 2026-04-21 (initial validation); extended 2026-05-05 (v1.1.0 server-side generation); documented 2026-09-05

## Context

The application has no accounts, yet votes and roles must be attributable and protected against tampering. Early iterations trusted client-side identification; an early security-audit pass ("implement server-side validation and secure user identification", v0.1.0 era) plus v1.1.0's "server-side ID generation for improved security" hardened the model into its current form. Persistent browser-local IDs arrived even earlier (v0.6.0) and needed a security re-review once they started traveling over the wire.

## Decision

- Every connection's identity is minted **server-side**: 8 bytes from `crypto/rand`, hex-encoded (16 characters), assigned at upgrade time in `serveWs`.
- Client-supplied identifiers are never trusted: action messages may contain a `name` or `userId` field, but the server binds every action to the connection's own ID (the `userId` field is honored only for the dealer's AFK-targeting, which is a *permission-checked* use, not identity spoofing).
- The ID persisted in the browser's `localStorage` is a **routing hint only** (sent back as `prevId` to enable ghost eviction). It grants nothing: presenting someone else's stored ID cannot make the server treat you as them.

## Alternatives

- **Client-generated UUIDs:** trivial impersonation — two tabs, same ID, vote spoofing.
- **Token-based sessions (login or room passwords):** rejected; friction is the product's enemy (see [ADR 0006](0006-dealer-role-and-no-dealer-fallback.md) for the same philosophy on the dealer seat).
- **Name-based identity:** names collide freely and are user-editable; they are display labels only.

## Consequences

- **Good:** no impersonation, no credential to steal, no auth infrastructure; name collisions are harmless (`TestNameCollision` pins this — two "Alice"s are distinct participants).
- **Bad / accepted:** identity is per-connection — a reconnect gets a new ID, so "the same user" is only as persistent as the browser's localStorage hint used for `prevId`; anyone who can guess a room name can join it (membership is not a secret).
- The server-side ID is also what makes the `prevId` eviction mechanism safe: the client can only ever *name* its own previous connection for eviction, and the server validates ownership via its index ([ADR 0008](0008-eviction-via-room-channel.md)).

## References

- `backend/client.go` (`generateID`, `serveWs`), `backend/room.go` (identity use in handlers)
- `frontend/src/hooks/useGameState.ts` (localStorage handling)
- [Architecture: Security](../architecture/security.md#identity), [Limitations](../architecture/limitations.md)