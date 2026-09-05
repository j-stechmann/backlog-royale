# 0005. Server-side vote secrecy

**Status:** Accepted
**Date:** 2026-04-21 (original decision); documented 2026-09-05

## Context

Planning poker only works if votes are secret until the reveal. The first implementation hid votes in the UI (empty card faces until reveal). A security-audit pass in the v0.1.0 era ("implement server-side validation and secure user identification") flagged that client-side hiding leaks: any participant could read the raw WebSocket frames and see every vote before the reveal, breaking the core mechanic of the game.

## Decision

Vote secrecy is enforced **in the serializer**: `getVisibleVote` returns the real vote only while `isRevealed` is true, and `broadcastStateLocked` applies it per user on every snapshot. The server never transmits hidden votes — before a reveal, other players' `vote` fields are empty/omitted, and only `hasVoted` flags are visible.

## Alternatives

- **UI-only hiding:** what the code did before the audit; leaks via devtools, rejected.
- **Encrypted-until-reveal:** unnecessary theater — the server itself is the trusted party, so encryption adds key-distribution problems without closing any real gap.
- **Per-recipient filtering beyond secrecy** (hide progress from players): rejected as over-engineering; progress is public by design.

## Consequences

- **Good:** the core mechanic holds against curious participants, not just honest UIs; one implementation point (the serializer) instead of scattered UI logic.
- **Bad / accepted:** the reveal flag is binary room-wide — there is no "reveal only to dealer" view; vote *immutability* after a reveal is still only a UI guard ([Game rules → Known gaps](../product/game-rules.md#known-gaps-between-ui-and-server-enforcement)).
- Abstain ("A") counts as voted, so `hasVoted` leaks *that* a player formally opted out — deliberate, part of the card semantics ([Game rules](../product/game-rules.md#card-semantics)).

## References

- `backend/room.go` (`getVisibleVote`, `broadcastStateLocked`, `RoomState`)
- `backend/room_test.go` (`TestAbstainVoteCountsAsVoted` asserts the hidden-before-reveal invariant)
- [Architecture: Security](../architecture/security.md#vote-secrecy)