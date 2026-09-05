# Testing Strategy

What is tested, how, and why the tests are written the way they are. The house rules come from hard-won flake fixes — two of them (v1.9.0, v1.9.1) reshaped the backend test suite.

## The portfolio

| Area | Suite | Runner |
| :--- | :--- | :--- |
| Backend game rules & lifecycle | `backend/room_test.go` | `go test` |
| Frontend hooks | `useBacklogRoyale.test.ts`, `useTheme.test.ts` | Vitest + jsdom |
| Frontend components | `PlayerList.test.tsx`, `VotingPanel.test.tsx`, `VoteSummary.test.tsx` | Vitest + React Testing Library |
| Vote-band color mapping | `utils/theme.test.ts` | Vitest |
| Docker builds (no push) | `docker` CI job | buildx |
| Linting | ESLint flat config | `npm run lint` |

## CI vs. local

CI runs `go test -v ./...` (no race detector) and the frontend trio (`test`, `lint`, `build`). The backend suite is *designed* to run cleanly under `-race` — race-safety was a driver for the broadcast-signal test helpers — but `-race` verification is a **manual/local practice, not pipeline-enforced**. Run it before touching concurrency code:

```bash
cd backend && go test -race ./...
```

## Backend rules (learned the hard way)

### Rule 1: never read `r.clients` from tests

The `clients` map is owned by the room's `Run` goroutine and is not covered by `r.mu`. Tests that want to know "did the register/evict/unregister get processed?" must **not** peek at it. Instead:

- **`waitForBroadcast(t, send, what)`** — confirms processing by receiving the state broadcast that the transition triggers. No sleeps, no reads of shared state.
- **`waitForCondition(t, room, predicate, what)`** — polls a predicate with a bounded timeout; the predicate runs under `r.mu`, so it may read `participants`/`dealerID` but must never touch `r.clients`.

These helpers exist because of two documented flakes:

- **v1.9.0, `TestReconnectDeduplication`:** a fixed sleep plus an unlocked `r.clients` read was a latent data race; replaced with broadcast-signal waiting.
- **v1.9.1, `TestEvictClient`:** the test queued registers and broadcasts into buffered channels before `Run()` processed any; `select` picks ready cases pseudo-randomly, so a broadcast could run before the registers — with an empty room, `broadcastStateLocked` sends nothing and the `len(r.clients) == 0` check tears the room down, timing out the test. Fix: await each registration's initial broadcast before sending any action (the pattern `TestEvictNonExistentClient` already used). Verified with 50 repeated runs under `-race`.

### Rule 2: handler-level tests, not end-to-end sockets

Most backend tests call `room.handleAction(...)` directly with hand-built `Client` structs — fast, deterministic, and race-free by construction. Only the lifecycle tests (dedup, eviction, teardown) exercise the goroutine machinery, and they use the helpers above plus a `mustMarshal` utility and a 2-second polling deadline. The game rules each have a test: voting and allowed values, abstain counting, name collisions, dealer takeover, AFK rules (including the un-AFK restriction), no-dealer mode, and the empty-room teardown.

## Frontend rules

### The `MockWebSocket` double

`useBacklogRoyale.test.ts` replaces the global `WebSocket` with a deterministic double that:

- tracks **all instances** (tests can inspect both old and new sockets after a room switch),
- sets `readyState = CLOSED` on `close()`,
- exposes `WebSocket.OPEN`/`CLOSED` statics,
- fires `onclose` **synchronously** on `close()` — chosen over an async close specifically so test ordering is deterministic (the decision is commented in the source).

### What the hook tests pin down

- URL construction: `room`/`name` encoding, `prevId` present when provided, absent when empty, and never an `id` param.
- `WELCOME` handling: ID callback fires; does *not* trigger a redundant reconnect (prevId lives in a ref, not a dependency).
- Reconnect: unintentional close schedules a reconnect; cleanup bumps the generation so stale `onclose` handlers bail — the StrictMode-safety story ([ADR 0008](../adr/0008-eviction-via-room-channel.md)).
- `sendAction` targets the *current* socket.

### Component tests

- Use `data-testid` hooks rather than brittle text/structure assertions (v1.9.0's vote-card-selection test switch).
- `VoteSummary` tests pin the exact ordering semantics (count-desc, then `CARD_VALUES` order) and the abstain card's Ban-icon rendering.
- `useTheme.test.ts` covers default/system mode, localStorage override, invalid-value normalization, OS-change reactivity (system mode only), class application, and persistence.

## Adding tests for a new feature

1. New server behavior → `room_test.go`, handler-level, using the helpers; run `-race`.
2. New hook logic → extend the hook's test file with the existing doubles; keep socket ordering synchronous.
3. New UI behavior → component test with `data-testid`; assert *outcomes* (what is rendered/disabled), not class names.
4. If you fix a flake, do not just retry — make the ordering deterministic (that is what both v1.9.x flake fixes did) and document the mechanism in the test comment.