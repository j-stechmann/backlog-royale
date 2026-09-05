# Architecture Decision Records

This directory contains the Architecture Decision Records (ADRs) for Backlog Royale: short, numbered documents that capture a significant design decision, the context it was made in, and the trade-offs accepted.

## Index

| ADR | Status | Title |
| :--- | :--- | :--- |
| [0001](0001-in-memory-state.md) | Accepted | In-memory state, no persistence |
| [0002](0002-full-state-broadcasts.md) | Accepted | Full-state broadcast synchronization |
| [0003](0003-server-authoritative-identity.md) | Accepted | Server-authoritative identity |
| [0004](0004-json-websocket-protocol.md) | Accepted | JSON over WebSocket protocol |
| [0005](0005-server-side-vote-secrecy.md) | Accepted | Server-side vote secrecy |
| [0006](0006-dealer-role-and-no-dealer-fallback.md) | Accepted | Dealer role and the no-dealer fallback |
| [0007](0007-distribution-only-vote-summary.md) | Accepted | Distribution-only vote summary |
| [0008](0008-eviction-via-room-channel.md) | Accepted | Room eviction via per-room channel |
| [0009](0009-semantic-tokens-and-dark-theme.md) | Accepted | Semantic color tokens and dark theme |
| [0010](0010-dependency-automation.md) | Accepted | Automated dependency management |
| [0011](0011-go-version-triangle.md) | Accepted | The Go version triangle |
| [0012](0012-git-flow.md) | Accepted | Git Flow branching model |

## Process

1. **Proposed:** the ADR is drafted with status `Proposed` in a PR. Anything contentious should be an ADR, not a buried code review thread.
2. **Accepted:** merged with status `Accepted`. The decision is now binding; implementation references the ADR.
3. **Superseded:** decisions are *not edited* after acceptance. To change course, write a new ADR that supersedes the old one, link both ways (`Supersedes:` / `Superseded by:`), and re-status the old one.
4. **Deprecated:** for decisions that simply no longer apply with no replacement.

## Format

Each ADR follows the same skeleton:

```markdown
# NNNN. Title
**Status:** Proposed | Accepted | Superseded by NNNN | Deprecated
**Date:** YYYY-MM-DD

## Context          — the forces at play; the problem, constraints, prior state
## Decision         — what was decided, stated plainly
## Alternatives     — what else was considered, and why it lost
## Consequences     — the good, the bad, and what we now accept
## References       — code paths, related ADRs, issues
```

Keep ADRs short (the examples here are near the upper bound) and factual. Rationale that belongs to a whole *system* rather than a *decision* goes in the [architecture docs](../architecture/overview.md) instead.

## Historical note

These ADRs were written *after the fact* (September 2026), reconstructing decisions already shipped in the codebase between v0.1.0 and v1.9.x. Their "Context" sections therefore describe history as it happened, verified against git history and the changelog — they are retro-rationale, not prophecy. New decisions should follow the normal proposed→accepted flow from day one.