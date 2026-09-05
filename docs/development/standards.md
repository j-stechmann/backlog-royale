# Coding Standards

The project's "laws" — the non-negotiables that keep the codebase boring in the good way. The short version lives in [CONTRIBUTING](../../CONTRIBUTING.md); this page adds the rationale and the concrete patterns. These apply to human and AI contributors alike.

## Universal

1. **Verification is mandatory.** All tests pass before any PR is finalized; new features ship with tests ([Testing strategy](testing.md)). Lint clean (`npm run lint`, `go fmt`).
2. **Documentation moves with code.** Config change → [CONFIGURATION reference](../reference/configuration.md) + service README; decision → [ADR](../adr/README.md); user-visible change → [Features](../product/features.md)/[Game rules](../product/game-rules.md); *any* change → `CHANGELOG.md` under `[Unreleased]`.
3. **No comments unless asked.** The codebase comments only where the *why* is non-obvious (concurrency caveats, test helpers); when a comment exists, it explains an invariant, not syntax.
4. **Relative links in docs**, and service READMEs stay short — pointers into `docs/`, not duplicates of it.

## Backend (Go)

### Logging

**Use `log/slog` for structured logging. Never `fmt.Printf` or the stdlib `log` package.** The server emits JSON logs consumed by log stacks (see [Logging](../operations/logging.md)); unstructured prints are invisible to those consumers. Log at the right level: `Info` for lifecycle (room create/remove, server start), `Warn` for degraded-but-recovered paths (dropped messages, full channels), `Error` for failures that lose data or crash the request, `Debug` for per-action traces (off by default).

### Typing

**Strictly typed structs for all JSON. Never `map[string]interface{}`.** The wire protocol is defined by `ActionMessage`, `RoomState`, `User`, `WelcomeMessage`; both sides diff cleanly and the compiler catches drift. If you need an optional field, use `omitempty` — the `User.Vote` secrecy pattern is the canonical example ([ADR 0005](../adr/0005-server-side-vote-secrecy.md)).

### Concurrency

- **`Room.clients` is owned by the room's goroutine.** Membership changes go through channels; game state goes through `r.mu` ([Concurrency model](../architecture/concurrency.md)).
- **Every channel send that can race with teardown is non-blocking with a `default` branch** — and every dropped send logs a warning. Silent drops made ghost clients undiagnosable before v1.9.0; the warning parity is a deliberate, reviewed property.
- **Never mutate another room's state from the Hub** — use the eviction handoff ([ADR 0008](../adr/0008-eviction-via-room-channel.md)).

### Configuration

Environment variables only, parsed in `loadConfig()` in `main.go` with sane dev defaults. No config files, no flags. Any new variable must be added to the [configuration reference](../reference/configuration.md) and both service READMEs.

### Constants

Wire strings (roles, actions, message types) live in `backend/constants.go` and are mirrored in `frontend/src/constants.ts`. Never inline a `"VOTE"` string in handler code.

## Frontend (React)

### State management

**Prefer hooks and context over global state libraries.** The app's entire state lives in three custom hooks (`useGameState`, `useBacklogRoyale`, `useTheme`); nothing else is warranted at this size. Derived state stays derived (`resolvedTheme` is computed, not stored in an effect).

### URLs

**Never hardcode URLs.** WebSocket URLs come from `import.meta.env.VITE_WS_URL` or runtime derivation ([Configuration](../reference/configuration.md)); room navigation uses `history.pushState` with the current URL as the base. This is what keeps the same bundle working on localhost, behind a proxy, and on a custom origin.

### Components

- Function components with TypeScript interfaces for props; named exports (`export const Component`).
- Semantic token utilities only (`bg-surface`, `text-content`, …) — raw palette classes are reserved for the vote-band mapping ([ADR 0009](../adr/0009-semantic-tokens-and-dark-theme.md)).
- Accessibility decisions are deliberate and test-covered: `role="group"` + `aria-pressed` for the theme toggle (plain-button pattern over a radiogroup without arrow-key support), AA-contrast accent split, dark glyph on the voted pill.
- Shared markup gets extracted (the `ThemeToggle` consolidation in v1.9.0 is the pattern), including the constants that drive it.

### Testing

Vitest + React Testing Library; hooks via `renderHook`; a synchronous `MockWebSocket` double ([Testing strategy](testing.md)). Test outcomes, not class names.

## Commits and PRs

### Commit messages

- Imperative mood, concise subject: `feat: add dark theme with OS-preference switching`.
- Conventional prefixes in practice: `feat:`, `fix:`, `test:`, `docs:`, `ci:`, `chore:`, `refactor:`, `build(deps):` (Dependabot uses `build(deps): bump … in /<dir>`).
- One logical change per commit; the body explains *why* when the diff cannot.

### Pull requests

- Git Flow: `feature/name` → `develop`; `hotfix/name` → `main` ([ADR 0012](../adr/0012-git-flow.md)).
- CI must be green (`backend`, `frontend`, `docker`); PRs against `main` require human approval.
- Dependabot PRs are exempt from manual work by policy — majors are labeled and wait ([Dependency management](dependencies.md)).
- Review findings are fixed in follow-up commits on the same branch (the project's history shows `Fix review finding: …` commits) — no force-pushed rewrites of reviewed work.

## Adding a dependency (either side)

Check whether the standard library / existing deps cover it first. If not: one commit, regenerated lockfile, PR description justifying the addition, and an [ADR](../adr/README.md) if it is a runtime dependency or introduces a new pattern. Never bump the `go` directive as part of a dependency change — [the triangle](../adr/0011-go-version-triangle.md).