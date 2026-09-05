# 0006. Dealer role and the no-dealer fallback

**Status:** Accepted
**Date:** 2026-05-05 (dealer role, v0.8.0); extended 2026-08-02 (no-dealer fallback, v1.6.0); documented 2026-09-05

## Context

Real ceremonies have a facilitator: someone who runs the reveal, keeps the pace, and does not vote. But the tool must also work for ad-hoc sessions — a hallway conversation, a quick gut-check — where nobody wants the facilitator hat. Both requirements pull against each other: a mandatory dealer deadlocks the second scenario; no dealer at all weakens the first.

## Decision

Two-part model:

1. **Dealer role (v0.8.0):** any player can claim the dealer seat. The dealer sees voting progress and manages rounds (REVEAL/RESET) but deliberately **does not vote** — the facilitator must not anchor the team with an estimate. Dealer takeover is always permitted: claiming the seat demotes the current dealer. The seat vacates automatically on step-down, AFK, disconnect, or eviction.
2. **No-dealer fallback (v1.6.0):** when no dealer is present, any **non-AFK player** may REVEAL/RESET, so ad-hoc sessions never deadlock. When a dealer *is* present, management is dealer-exclusive again. AFK players are excluded from round management in both modes.

## Alternatives

- **Mandatory dealer (room creator):** deadlocks ad-hoc groups; also entangles "who created the room" with identity, which the app does not track ([ADR 0003](0003-server-authoritative-identity.md)).
- **Everyone can always manage:** removes the facilitator's pacing control and lets any player force reveals early.
- **Dealer may vote:** reintroduces anchoring — the entire point of the role is a non-voting facilitator.

## Consequences

- **Good:** structured ceremonies get a facilitator; unstructured ones self-organize; the UI surfaces which mode is active (`canManageRound`).
- **Bad / accepted:** takeover means a malicious participant can seize the seat (accepted under the trusted-team threat model, [Security](../architecture/security.md)); "any player can reveal when no dealer exists" weakens the pre-reveal suspense in ad-hoc rooms.
- Interaction with AFK required careful rule-making: a dealer going AFK vacates the seat, and only players themselves may return from AFK (v1.2.0) — the dealer cannot drag someone back into a vote. The full matrix is in [Game rules](../product/game-rules.md#permission-matrix).

## References

- `backend/room.go` (`handleToggleRole`, `handleReveal`, `handleReset`, `handleToggleAFK`)
- `backend/room_test.go` (`TestDealerRole`, `TestNoDealerPlayerManageRound`, `TestAFKRole`)
- [Features: Dealer role](../product/features.md#dealer-role), [Features: Dealer-free rounds](../product/features.md#dealer-free-rounds)