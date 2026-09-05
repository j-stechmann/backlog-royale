# Known Limitations

What this design deliberately does not do. Each item lists the accepted trade-off and, where one exists, the decision record behind it. Nothing here is an accident — but all of it is fair game for a future ADR if requirements change.

## Structural

### No persistence

All room state is in the Go process's memory. A restart (deploy, crash, host migration) loses every room and vote. Accepted because ceremonies are short and infra simplicity is a feature ([ADR 0001](../adr/0001-in-memory-state.md)). A persistence layer (Redis/Postgres) is listed as future work in [Configuration](../reference/configuration.md).

### Single instance, no horizontal scaling

Rooms live in one process's memory, so replicas would each see different rooms. Scaling out requires sticky sessions plus an external room registry or pub/sub bus. Explicitly out of scope for a team-sized tool.

### Unauthenticated rooms

Anyone with the room name can join, and (once in) read all traffic for that room. Rate limits, the 512-byte message cap, and strict origin checks are the abuse mitigations; secrecy of *votes within* a room is protected, secrecy of *membership* is not a goal ([ADR 0003](../adr/0003-server-authoritative-identity.md)).

## Server-side enforcement gaps

The server's authorization model is deliberately minimal; the UI adds convenience gating that the server does not replicate. From a browser with devtools open:

- **Early reveal:** an authorized client may send `REVEAL` before everyone has voted — the server checks role, not completeness.
- **Vote mutation after reveal:** `handleVote` validates role and card value only, never `isRevealed`; the UI's post-reveal lock is client-side only.
- **Stale votes across resets:** votes persist in the server's `participants` map until a reset; the UI presents a reset as a clean slate.

Full list and rationale in [Game rules → Known gaps](../product/game-rules.md#known-gaps-between-ui-and-server-enforcement).

## Implementation details

### Unbounded IP-limiter map

`ipLimiters` keeps one `rate.Limiter` per unique IP for the lifetime of the process — fine behind small/proxied deployments, a slow memory leak at internet scale ([Security](security.md)).

### Shared upgrader's `CheckOrigin`

`upgrader.CheckOrigin` is reassigned per request on the shared upgrader value. Functionally correct with a single configured origin, but not goroutine-safe by the letter of the Gorilla docs; pinning one origin per deployment avoids the issue in practice.

### No server → client error channel

Invalid or unauthorized actions fail silently: the server logs them, but the offending client receives no negative acknowledgment — only the next `STATE` re-asserting reality ([Protocol](../reference/protocol.md)).

### Client-side reset heuristic

The reset signal is inferred from state transitions (voted-count drop or reveal flip) rather than a dedicated protocol event; worst case it clears one local card selection ([Frontend](frontend.md#derived-state-reset-heuristic)).

### Fixed 3 s reconnect, no backoff or jitter

Simple and predictable; the server's per-IP limiter (burst 10) tolerates small fleets retrying simultaneously. Would need revisiting for large deployments.

## Cosmetic / accepted

- **The favicon does not theme** (favicons cannot be re-themed at runtime); it stays light/brand-colored. Documented in the v1.9.0 changelog notes.
- **The logo crown's amber-700 stroke** is low-contrast in dark mode; tracked as a known cosmetic item in the v1.9.0 changelog notes.
- **Vote summary shows distributions only** — no average, no consensus, by design ([ADR 0007](../adr/0007-distribution-only-vote-summary.md)).

## When these stop being acceptable

If any of the following become requirements, the affected decisions should be revisited via new ADRs (see the [ADR process](../adr/README.md)):

| Requirement | Impacted decisions |
| :--- | :--- |
| Survive deploys without losing sessions | ADR 0001 (persistence), single-instance |
| > a few hundred concurrent players | ADR 0002 (deltas/ batching), single-instance, reconnect backoff |
| Hostile/multi-tenant users | ADR 0003 (real auth), server-side phase checks, moderation |
| Multiple replicas | in-memory state + Hub index (needs external registry) |
| Compliance-grade audit trails | in-memory state, no error channel, JSON-only logging |