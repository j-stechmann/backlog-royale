# Game Rules

The authoritative rules of a Backlog Royale session: who may do what, when, and what each card means. The server (`backend/room.go`) is the single source of truth for all of this; the frontend merely reflects the state it receives.

## Roles

Every connection starts as a **player**. There are three roles, tracked per connection on the server:

| Role | Votes | Sees | Manages rounds | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `player` | Yes | Voting grid | Only when no dealer is present | Default role |
| `dealer` | No (deliberately — see [ADR 0006](../adr/0006-dealer-role-and-no-dealer-fallback.md)) | Voting progress, summary | Always | At most one per room |
| `afk` | No | Room only | Never | Vote cleared on entry |

### Becoming and leaving the dealer seat

- Any player can toggle themselves to dealer at any time. If a dealer already exists, **takeover is permitted**: the current dealer is demoted to player automatically. There is no permission gate on takeover.
- Becoming dealer clears the new dealer's own vote (they are leaving the voting pool).
- The dealer seat is vacated when the dealer: toggles back to player, goes AFK, disconnects, or is evicted (room switch). When the seat is vacated, the room returns to dealer-free mode.
- The dealer stepping down does *not* restore any vote they had (it was cleared on entry).

### AFK rules in detail

- Toggling yourself AFK is always allowed, dealer or not. A dealer going AFK vacates the seat.
- Going AFK clears your vote, if any.
- Returning from AFK: **only the player themselves** can un-AFK. The dealer deliberately cannot return other players to the game (a v1.2.0 fix — the dealer must not be able to drag someone back into a vote).
- The dealer **can** send other players AFK, via the hover control on the player list (`UserStatus`).
- A non-dealer who sends a targeting `TOGGLE_AFK` message falls back to toggling *themselves* (fail-safe server behavior, covered by `TestAFKRole`).

## Round lifecycle

```
   join ──► VOTING ──► REVEALED ──► (reset) ──► VOTING
              ▲  │
              └──┘ (vote changes allowed until reveal)
```

1. **Voting phase** (`reveal = false`): each player may cast or change a vote at any time. Votes are secret; only `hasVoted` is broadcast. Voting progress (`x / y Voted`) counts players only.
2. **Reveal**: the dealer (or any non-AFK player, if no dealer exists) sends `REVEAL`. The room flips to `reveal = true`; the server now broadcasts real vote values, and clients show the distribution summary.
3. **Reset**: the dealer (or any non-AFK player, if no dealer exists) sends `RESET`. All votes are cleared and hidden; the room returns to the voting phase.
4. Rooms are destroyed automatically when the last participant leaves; a fresh join starts a brand-new room in the voting phase.

## Card semantics

| Card | Meaning | Counts as voted? | Color band |
| :--- | :--- | :--- | :--- |
| `1` `2` `3` `5` `8` `13` `21` | Fibonacci story points | Yes | emerald (≤3) / blue (≤8) / rose (≤21) |
| `?` | No idea / insufficient information | Yes | gray |
| `A` (Abstain) | Formal opt-out from this vote | **Yes** | gray |

Notes:

- Abstain counting as "voted" (v1.7.0) is deliberate: the progress meter should reflect that the player has formally made a choice, even if that choice is "not voting".
- The vote value is validated server-side against the `allowedVotes` set; anything else (including "100") is ignored and the previous vote is kept.
- The dealer never has a vote; AFK players' votes are cleared.

## Permission matrix

| Action | player (dealer present) | player (no dealer) | dealer | afk |
| :--- | :--- | :--- | :--- | :--- |
| `VOTE` | ✓ | ✓ | ✗ | ✗ |
| `REVEAL` | ✗ | ✓ | ✓ | ✗ |
| `RESET` | ✗ | ✓ | ✓ | ✗ |
| `TOGGLE_ROLE` (self) | ✓ | ✓ | ✓ | ✓ |
| `TOGGLE_AFK` (self) | ✓ | ✓ | ✓ | ✓ |
| `TOGGLE_AFK` (send other AFK) | ✗ | ✗ | ✓ | ✗ |
| `TOGGLE_AFK` (un-AFK other) | ✗ | ✗ | **✗** | ✗ |

The full wire-format for each action is in the [protocol reference](../reference/protocol.md). The server-side enforcement code is `backend/room.go` (`handleVote`, `handleReveal`, `handleReset`, `handleToggleRole`, `handleToggleAFK`).

## Known gaps between UI and server enforcement

The server's authorization model is deliberately minimal; the UI adds convenience gating that the server does not replicate. A user with devtools open can:

- **reveal before everyone has voted** — the UI disables the Reveal button until all players have voted; the server checks role only, not completeness;
- **vote after a reveal** — the UI blocks it; the server's `handleVote` validates role and card value only, so a client that bypasses the UI can change a vote while `reveal = true` and the changed vote is broadcast immediately;
- **change votes between rounds** — votes persist in the server's `participants` map until a reset; the UI presents a reset as a clean slate.

These are accepted for a trusted-team tool (see [Limitations](../architecture/limitations.md)); a hardened multi-tenant deployment would move these checks server-side.