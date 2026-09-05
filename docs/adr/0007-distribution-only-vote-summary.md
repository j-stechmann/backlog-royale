# 0007. Distribution-only vote summary

**Status:** Accepted
**Date:** 2026-04-21 (averages removed); refined 2026-06-02 (v1.4.0 layout), 2026-06-09 (v1.5.0 all players); documented 2026-09-05

## Context

After a reveal, the tool must present the votes in a way that starts the *right* conversation. The original implementation displayed a computed consensus result and an average alongside the votes. Commit `21f6d55` ("remove consensus result and average calculation from UI") removed both within the first day of the project's life.

## Decision

The post-reveal summary shows only the **distribution** of votes — `3 × 5`, `2 × 8`, `1 × ?` — as styled cards, sorted by count with ties broken by card-deck order (`CARD_VALUES`), so equal counts always appear in the same order as on the voting screen (fixed in v1.9.0). No average, no median, no auto-selected "consensus" value. Since v1.5.0 the summary is visible to all players, not just the dealer.

## Alternatives

- **Average:** the classic planning-poker anti-pattern — it re-introduces exactly the anchoring the ceremony exists to avoid (everyone drifts toward a known mean) and implies false precision for ordinal estimates.
- **Consensus highlight ("the team agreed on 8"):** invites rounding arguments and silently overrides dissenting votes; disagreement is *information* and must stay visible.
- **Both distribution and average:** the "just in case" compromise; rejected because the average's presence re-anchors regardless of the distribution next to it.

## Consequences

- **Good:** outliers ("someone said 21, someone said 1") drive the discussion, which is the actual purpose of the ceremony; no numeric authority to argue with.
- **Bad / accepted:** facilitators who want an average must compute it themselves (or not — see the rationale above); the tie-break rule is a UI convention, not protocol ([Frontend](../architecture/frontend.md#components)).
- The horizontal `count × card` layout (v1.4.0) was chosen to reduce eye movement between counts and cards; the summary component has dedicated tests pinning the ordering and icon semantics.

## References

- `frontend/src/components/VoteSummary.tsx`, `frontend/src/utils/theme.ts`
- git history: `21f6d55` (removal), `3f2e8d3`/`268cc44` (v1.4.0), `f0b50d2` (v1.5.0), `91902cb` (v1.9.0 tie-break)
- [Features: Vote summary](../product/features.md#vote-summary-distribution)