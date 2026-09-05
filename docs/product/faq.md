# FAQ

Answers to the questions players, evaluators, and new contributors actually ask. For depth, follow the links into the architecture and decision records.

## For players

### Do I need an account?

No. A room name and a display name are all that is required. Nothing is registered anywhere; see [ADR 0003](../adr/0003-server-authoritative-identity.md) for how identity works without accounts.

### Can two people use the same name?

Yes. Names are display-only; votes and roles are tracked by server-assigned connection IDs, so "Alice" and "Alice" are distinct participants (covered by `TestNameCollision`). Your browser's stored ID just marks *you*.

### Can I be in two rooms at once?

Not from the same browser tab — joining a new room evicts your old connection (that is the `prevId` mechanism). A second browser tab or window, however, joins independently and can sit in any room. Tabs in the *same* room coexist peacefully, each with their own vote.

### What happens if I lose connection mid-vote?

The header shows "Reconnecting..." and the client retries every 3 seconds. Your in-flight vote is kept server-side under your previous identity only until the server notices the dead socket (up to a minute, via the ping/pong deadline), after which your vote is dropped — just vote again once reconnected. Details in [the connection lifecycle](../architecture/frontend.md#connection-lifecycle).

### Why can't the dealer vote?

Deliberate design. The dealer is the facilitator: they run the ceremony without anchoring the team with their own estimate. See [ADR 0006](../adr/0006-dealer-role-and-no-dealer-fallback.md). If you want the dealer to also estimate, have them step down (one click), vote, and take the seat back.

### What does the "A" card mean?

Abstain: a formal "I'm choosing not to vote on this one." It counts toward the voting progress so the round can complete, but shows as its own gray card in the summary. Shipped in v1.7.0; rationale in [Features](features.md#story-pointing-cards).

### Why is there no average or "consensus" number after a reveal?

Removed on purpose in the very first release iteration. Averages re-introduce anchoring — exactly what planning poker exists to avoid — and a single "consensus" number invites rounding arguments. The distribution keeps the discussion on outliers. See [ADR 0007](../adr/0007-distribution-only-vote-summary.md).

### Someone went AFK and can't come back — the dealer can't un-AFK them?

Correct, and deliberate: only the player themselves can return from AFK, so nobody can be pulled back into a vote against their will (v1.2.0). The AFK player just clicks "Return to Game".

## For evaluators / self-hosters

### Where is the database?

There isn't one. All room state is in the Go process's memory. A restart loses every room and vote. This is a documented trade-off, not an oversight — see [ADR 0001](../adr/0001-in-memory-state.md) and [Limitations](../architecture/limitations.md).

### Can I run multiple backend replicas?

Not without code changes. Rooms live in one process's memory, so replicas would each see different rooms; you need sticky sessions *and* an external room registry/bus to scale out. Single-instance is an accepted limitation for a team-sized tool.

### How many players can a room hold?

There is no hard cap. Every event broadcasts the full room state (O(n) JSON), which is trivial at team sizes (say, ≤ 50) and would degrade gracefully beyond that. The per-connection outbound buffer (256 messages) drops clients that cannot keep up — they reconnect automatically.

### Is it secure?

Threat-model-wise: votes are secret before a reveal (enforced server-side), connections are rate-limited and size-capped, origins are checked in production config, and rooms are effectively "knowable by name". There is no authentication or moderation beyond the dealer mechanics. Read [Security](../architecture/security.md) and [Limitations](../architecture/limitations.md) before exposing it to strangers.

### Does it work on mobile?

Yes — the UI is responsive and the WebSocket connection survives typical mobile network blips via automatic reconnection.

## For contributors

### Where do I start?

[Getting started](../guides/getting-started.md) to run it locally, then [Development setup](../development/setup.md) and the [coding standards](../development/standards.md). New features need tests; see [Testing strategy](../development/testing.md).

### Why do tests receive broadcasts instead of sleeping?

Because sleeping is flaky. Backend tests confirm a register/evict/unregister was processed by receiving the state broadcast it triggers; predicates are polled under the room mutex. The `clients` map is never read from tests (the `Run` goroutine owns it). The full reasoning is in [Testing strategy](../development/testing.md).

### Can I add a dependency?

Check the [dependency management policy](../development/dependencies.md) first. Routine bumps arrive via grouped Dependabot PRs; adding a *new* runtime dependency deserves an ADR. Never bump the `go` directive by hand without updating the three places of the [Go version triangle](../adr/0011-go-version-triangle.md).

### I found a documentation error

Fix it and include it in your PR — but if it contradicts an **accepted ADR**, the doc is probably *right* and the code drifted, or vice versa: flag it in the PR and reference the ADR. ADRs are changed by superseding, not editing (see the [ADR process](../adr/README.md)).