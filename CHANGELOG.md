# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Documentation
- Reorganized all project documentation into a `docs/` tree with a [documentation map](docs/README.md): product (`features`, `game-rules`, `faq`), architecture (`overview`, `backend`, `frontend`, `concurrency`, `security`, `limitations`), 12 Architecture Decision Records (`docs/adr/`), reference (`protocol`, `configuration`), guides (`getting-started`, `usage`, `self-hosting`), development (`setup`, `testing`, `standards`, `release-process`, `dependencies`), and operations (`ci-cd`, `logging`, `troubleshooting`).
- The former root `ARCHITECTURE.md`, `CONFIGURATION.md`, and `CONTRIBUTING.md` became redirects; `CONTRIBUTING.md` lives at `docs/CONTRIBUTING.md` (root remains recognized as redirect) and `AGENTS.md` now points agents at the `docs/` tree. Service READMEs link into `docs/`. The architecture content (concurrency model, identity/deduplication incl. `prevId` caveats, full WebSocket protocol, design decisions & trade-offs, deployment/CI, testing strategy, known limitations) is now split across the architecture pages and ADRs, with every claim verified against the current code.
- Corrected accuracy details surfaced by review: the log catalog now explains that a ghost client from a dropped unregister lingers until its outbound send buffer fills or the room self-destructs (the socket is already dead, so no read-pump cleanup follows), the protocol reference no longer calls rate-limited messages "silently dropped" — the server logs a warning, only the client gets no feedback — the `STATE` example no longer shows a `vote` field while `reveal` is `false`, the release history no longer attributes the Go 1.27 triangle alignment to v1.9.2 (v1.9.2 only bumped the Docker builder; the alignment is unreleased), the logging queries count the three "full, dropping" warnings plus the separate `room register channel full` close path, the CI docs classify `metadata-action@v6` as major-tag-pinned, the CSP shorthand includes `'self'` in `connect-src`, and the log-consumption example uses `docker compose logs` instead of a container name Compose does not create.

### Added
- **Automated dependency merging**: Dependabot now opens weekly, grouped PRs (minor+patch per ecosystem) against `develop` and auto-merges them once CI is green; major bumps and all PRs targeting `main` always require manual review. Configured via `.github/dependabot.yml` and `.github/workflows/dependabot-auto-merge.yml`, plus branch protection: `develop` requires green CI checks, `main` additionally requires human approval — production can never be updated automatically.
- Docker build smoke-test job in CI (`docker`: builds both images without pushing) so base-image updates are validated before they can merge into `develop`.

### Changed
- Aligned the Go version triangle: `backend/go.mod` (1.26.1 → 1.27.0) and CI (`go-version: 1.27.x`) now match the backend Dockerfile builder (`golang:1.27.0-alpine3.23`); README prerequisites updated to Go 1.27. Dependabot is configured to ignore all version updates (major/minor/patch) of the go.mod `go` directive — including patch bumps triggered by a dependency's own `go` directive requirement, which would otherwise auto-merge and make builds silently download a newer toolchain via `GOTOOLCHAIN=auto` — so CI and the Dockerfile never fall out of sync again.
- Replaced Dependabot's daily per-package PR flood with a weekly schedule grouped into one minor+patch PR per ecosystem (npm split production/development, Go, Docker frontend/backend, GitHub Actions), limited to 10 open PRs; security updates remain immediate and individual.
- `golang.org/x/time` is now declared as a direct dependency in `backend/go.mod` (it is imported by `main.go`/`client.go`); `go mod tidy` dropped its incorrect `// indirect` marker.
- Updated `frontend/package-lock.json` to fix `nanoid` < 3.3.18 (GHSA-2v37-7h3g-55p8, high severity, via postcss).
- Pinned all Dockerfile base images to specific versions (golang 1.27.0-alpine3.23, node 26.7.0-alpine3.23, alpine 3.23.5, nginx-unprivileged 1.31.4-alpine3.24) for reproducible builds; floating tags like `alpine:latest` and `nginx:alpine` can no longer drift.
- Containers now run as non-root: the backend uses a dedicated `appuser`, and the frontend uses `nginxinc/nginx-unprivileged`. The frontend container now listens on port 8080 instead of 80; `docker-compose.yml` maps it to host port 8081.
- Switched frontend Docker build and local setup instructions from `npm install` to `npm ci` so builds are locked to `package-lock.json`.

### Removed
- Deleted an untracked empty `package-lock.json` from the local working tree (the file was never committed to the repository).

## [1.9.2] - 2026-08-30

### Technical
- Updated backend base image: golang (1.26.6-alpine → 1.27.0-alpine).
- Updated frontend dependencies: lucide-react (1.32.0 → 1.33.0).
- Updated frontend dev dependencies: @vitejs/plugin-react (6.0.5 → 6.1.0), vitest (4.1.10 → 4.1.11), eslint (10.8.1 → 10.9.0), vite (8.2.1 → 8.2.2).
- Bumped `frontend/package.json` and `frontend/package-lock.json` version to 1.9.2.

## [1.9.1] - 2026-08-21

### Fixed
- Eliminated a flake in the backend `TestEvictClient` test. The test queued 2 register and 3 broadcast messages into buffered channels before `Room.Run()` processed any; since `select` picks ready cases pseudo-randomly, a broadcast could be handled before the registers, causing `broadcastStateLocked` to send nothing and the `len(r.clients) == 0` check to close the room immediately (timing out the wait condition at `room_test.go:462`). The test now waits for each client's initial broadcast after registering — the same pattern already used in `TestEvictNonExistentClient` — before sending any action messages. Verified with 50 repeated runs under `-race`.

### Technical
- Bumped `frontend/package.json` and `frontend/package-lock.json` version to 1.9.1.

## [1.9.0] - 2026-08-21

### Added
- **Dark theme** with three modes — light, dark, and system (follows the OS `prefers-color-scheme`). The choice is persisted in `localStorage` under `backlog_royale_theme` and applied via a `.dark` class on `<html>`. An inline pre-paint script in `index.html` prevents a flash of the wrong theme on reload. A 3-state segmented toggle (Sun/Moon/Monitor) is available in the header and on the join screen.

### Changed
- Refactored the frontend styling from hardcoded Tailwind color utilities to a set of 22 semantic CSS color tokens (`base`, `surface`, `line`, `content`, `accent`, `warn`, `ok`, etc.) defined via Tailwind v4 `@theme inline` with `:root`/`.dark` overrides. Components consume semantic utilities (`bg-surface`, `text-content`, `border-line`, …) instead of raw palette colors, so dark mode is a single `.dark` variable block.
- Split `accent` into `accent` (button backgrounds, blue-600 in both themes) and `accent-text` (on-surface blue text/icons, blue-600/blue-400) to keep WCAG AA contrast in both modes. Added `accent-strong` (blue-700/blue-300) for hover backgrounds and status-panel headings.
- Vote-band colors in `src/utils/theme.ts` (emerald/blue/rose/gray) now include `dark:` variants per field; band backgrounds use `-900` (not `-950`) so the hue encoding stays visible on the dark surface.
- Inverted the "voted" checkmark to a dark glyph (`text-emerald-950`) on the green pill for WCAG AA compliance in both light and dark mode (was white-on-green-500 at 2.28:1; the earlier `text-content` fix only held in light mode and regressed in dark).
- `body` background now uses `var(--bg)` (raw token) instead of a hardcoded `#f9fafb`, and `App.tsx` uses `bg-base`.
- The sonner `<Toaster>` moved from `main.tsx` into `App.tsx` so it receives the current `theme` prop (light/dark/system); `position="top-center"` and `richColors` are preserved.

### Fixed
- Fixed players not being properly removed from a room when switching to a different room. The frontend now uses a connection-generation counter so that stale WebSocket `onclose` handlers from a previous room are ignored entirely (no spurious reconnects, no flicker, no orphaned sockets). The backend supports an optional `prevId` query parameter on the `/ws` endpoint; when provided, the server looks up the client's previous connection via a global client-ID-to-room index and evicts it from whichever room it is still in, providing server-side validation independent of client-side cleanup.
- Fixed a regression where opening a second browser tab for the same room evicted the first tab's live connection. `useGameState` now only forwards `prevId` when an actual room switch occurs (tracked via a `prevIdToEvict` state field cleared on welcome); reconnects within the same room and additional tabs in the same room no longer send the shared localStorage ID, so coexisting tabs keep their vote/dealer state.
- Corrected the "AFK" and "Become Dealer" header buttons whose `hover:` classes were identical to their base classes (no visible hover effect). Active states now darken to `accent-strong`/`warn-strong` with white text; inactive states dim to `surface-3/80`.
- Replaced zero-contrast `border-accent-soft`/`border-warn-soft` borders (drawn on matching `*-soft` backgrounds) with `border-accent/30`/`border-warn/30` in `PlayerList` and `VotingPanel` so the borders are actually visible.
- Vote summary cards now tie-break by `CARD_VALUES` index, so cards with equal counts appear in the same order as on the voting screen instead of arbitrary insertion order.

### Technical
- Added a global `clientID → *Room` index in the backend Hub (`Hub.index` / `Hub.idxMu`) with `Associate`/`Disassociate`/`EvictClient` methods. The index is maintained on client register, unregister, evict, and the `broadcastStateLocked` slow-client default path.
- Added a per-room `evict` channel (buffered, 64) consumed by `Room.Run()` to remove a client by ID, mirroring the existing `unregister` handler's lock-release-before-`broadcastState` ordering.
- Hardened all Room channels (`register`, `unregister`, `broadcast`, `evict`) with buffers and non-blocking sends in `readPump` / `serveWs` to prevent goroutine leaks when a room's `Run()` goroutine exits while clients are still connected.
- `readPump`'s non-blocking send to `room.broadcast` now logs a warning when the channel is full (previously dropped client actions such as VOTE silently), matching the logging already present in `EvictClient` and `serveWs`.
- `readPump`'s non-blocking send to `room.unregister` now logs a warning when the channel is full, matching the parity logging already present in `broadcast` and `EvictClient`. Previously a dropped unregister would silently leak a ghost client in `r.clients`, preventing `Room.Run` from exiting on a mass disconnect that exceeds the 64-slot buffer.
- Replaced the frontend `useBacklogRoyale` hook's implicit close/reconnect logic with a monotonic generation counter (`genRef`) captured per-socket. Cleanup increments the counter; stale `onclose` handlers compare and bail early. This is safe under React 19 StrictMode double-mounting.
- `prevId` is kept in a ref (not a `useCallback` dependency) so that receiving a WELCOME message (which updates the stored ID) does not trigger a redundant reconnect.
- Consolidated the previously-identical `subtle` and `muted` tokens into a single `muted` token (22 semantic tokens, down from 23); all `text-subtle`/`placeholder:text-subtle` usages now use `muted`.
- Extracted the duplicated `THEME_OPTIONS` array and toggle markup from `Header.tsx` and `JoinView.tsx` into a shared `src/components/ThemeToggle.tsx`. The toggle uses `role="group"` + `aria-pressed` buttons (plain-button semantics) rather than a `role="radiogroup"` that lacked the corresponding arrow-key keyboard pattern.
- Added `src/hooks/useTheme.ts` (matchMedia subscription effect + `.dark` class-application effect) with `useTheme.test.ts` covering default/system mode, localStorage override, invalid-value normalization, OS-change reactivity (system mode only), class application, and persistence.
- Rewrote `src/utils/theme.test.ts` to use a `classesOf()` set-membership helper and assert all six fields per band (text/bg/border/ring/shadow/hoverBorder).
- `Logo.tsx` now uses inline `style={{ fill: 'var(--surface)' }}` (raw tokens, since `@theme inline` does not emit `--color-*` to `:root`) for theme-aware card chrome; crown and jewels remain fixed brand colors.
- Added `surface-3` (lifted/inactive), `surface-inverse` (tooltip), `surface-highlight` (toggle active segment), `mid-text`, `content-soft`, `accent-text`, `accent-strong`, `warn-strong`, `glass` tokens. Renamed the glassmorphism border token to `glass` (utility `border-glass`).
- Added backend eviction tests (`TestEvictClient`, `TestEvictNonExistentClient`, `TestEvictLastClientClosesRoom`) and a `waitForCondition` test helper with `r.mu`-locked polling.
- Updated the frontend `MockWebSocket` test double to track all instances, set `readyState = CLOSED` on `close()`, expose `WebSocket.OPEN`/`WebSocket.CLOSED` statics, and fire `onclose` synchronously for deterministic test ordering. Added tests for room switching, same-props rerender, unintentional-close reconnect, and `sendAction` targeting the new socket.
- Updated `TestReconnectDeduplication` to use broadcast-signal-based waiting instead of a fixed sleep + unlocked `r.clients` read, fixing a latent data race under `-race`.
- `TestReconnectDeduplication` no longer uses a misleading empty `default` branch with a "drain and re-check" comment; the closed-channel check now blocks with a timeout and a clear comment explaining the closed-and-empty invariant.
- Bumped `frontend/package.json` and `frontend/package-lock.json` version to 1.9.0.

### Notes
- `public/favicon.svg` is intentionally left light/brand-colored (favicons don't theme at runtime).
- The amber-700 crown stroke in the logo may appear low-contrast in dark mode; tracked as a known cosmetic item.

## [1.8.1] - 2026-08-20

### Technical
- Updated frontend dev dependencies: eslint-plugin-react-refresh (0.5.3 → 0.5.4), globals (17.9.0 → 17.11.0), typescript-eslint (8.66.0 → 8.67.0).
- Bumped `frontend/package.json` and `frontend/package-lock.json` version to 1.8.1.

## [1.8.0] - 2026-08-20

### Added
- Display the app version (from `frontend/package.json`) as a small, unobtrusive label in the bottom-right corner of the frontend, shown on all views including the Join screen.

## [1.7.3] - 2026-08-17

### Technical
- Updated backend base image: golang (1.26.5-alpine → 1.26.6-alpine).
- Updated frontend dependencies: lucide-react (1.30.0 → 1.31.0), sonner (2.0.7 → 2.0.8).
- Updated frontend dev dependencies: @types/node (26.1.2 → 26.2.0), eslint (10.8.0 → 10.8.1), @testing-library/jest-dom (7.0.0 → 7.0.1).
- Bumped `frontend/package.json` and `frontend/package-lock.json` version to 1.7.3 (catch-up after v1.7.2 omitted the bump).

## [1.7.2] - 2026-08-10

### Technical
- Updated frontend dependencies: lucide-react (1.28.0 → 1.30.0).
- Updated frontend dev dependencies: vite (8.2.0 → 8.2.1), postcss (8.5.25 → 8.5.26).

## [1.7.1] - 2026-08-04

### Security
- Resolved 5 open and 2 auto-dismissed Dependabot security alerts in `frontend/package-lock.json` by upgrading transitive dependencies through their direct dependents:
  - **undici** now resolves to 8.10.0 (via `jsdom` 29.1.1 → 30.0.1), fixing the open alerts for undici < 7.29.0 (CVE-2026-6733, CVE-2026-6734, CVE-2026-9678, CVE-2026-9679, CVE-2026-12151).
  - **brace-expansion** now resolves to 5.0.9 (via `eslint` 10.7.0 → 10.8.0 → `minimatch` 10.2.6), fixing the auto-dismissed alerts for brace-expansion < 5.0.9 (CVE-2026-14257, CVE-2026-69152).
- No direct `package.json` security overrides required; vulnerabilities were cleared by accepting Dependabot's direct-dependency bumps.

### Technical
- Updated GitHub Actions: docker/login-action (4.5.2 → 4.6.0).
- Updated frontend dependencies: @types/react-dom (19.2.3 → 19.2.4), @emnapi/runtime (1.11.2 → 1.11.3).
- Updated frontend dev dependencies: eslint (10.7.0 → 10.8.0), globals (17.7.0 → 17.8.0), jsdom (29.1.1 → 30.0.1).
- Bumped CI Node version to 26 and updated README prerequisites to "Node.js 26+", aligning local development and CI with the existing `node:26-alpine` frontend Docker image and the Node engine requirement of jsdom 30.

## [1.7.0] - 2026-08-04

### Added
- "A" (Abstain) card allowing players to formally opt out of a vote. The abstain vote is rendered with a Ban icon, counts toward the voting-progress total, and appears in the vote summary distribution alongside the other cards.

### Technical
- Centralized the abstain card sentinel as `ABSTAIN_VALUE` in `frontend/src/constants.ts`, replacing inline `'A'` literals in `Card.tsx`, `CardFace.tsx`, and `theme.ts`.
- Tightened the `VoteSummary` abstain test to assert exact Ban-icon and aggregate-count values, and added a `getTheme('A')` test pinning the gray theme.
- Added a backend test (`TestAbstainVoteCountsAsVoted`) asserting that an abstain vote sets `HasVoted: true` in the broadcast state and stays hidden before reveal.
- Removed the unused `sharedClassName` prop from `CardFace` and added a trailing newline.

## [1.6.1] - 2026-08-02

### Technical
- Extended CI workflow (`.github/workflows/ci.yml`) to trigger on pushes to and pull requests against `develop`, in addition to `main`. This aligns CI with the Git Flow model where `develop` is the integration branch for features and dependency bumps.
- Updated GitHub Actions: docker/login-action (4 → 4.5.2).
- Updated frontend dependencies: react (19.2.7 → 19.2.8), react-dom (19.2.7 → 19.2.8), lucide-react (1.25.0 → 1.28.0).
- Updated frontend dev dependencies: @vitejs/plugin-react (6.0.3 → 6.0.5), postcss (8.5.21 → 8.5.25).

## [1.6.0] - 2026-08-02

### Added
- When no dealer is present in a room, any non-AFK player can reveal the round results and start the next round. AFK users are still excluded from managing rounds, and when a dealer is present the management controls remain dealer-exclusive.

## [1.5.3] - 2026-07-21

### Technical
- Updated frontend dependencies: lucide-react (1.24.0 → 1.25.0), typescript-eslint (8.64.0 → 8.65.0), @testing-library/jest-dom (6.9.1 → 7.0.0), postcss (8.5.19 → 8.5.21).

## [1.5.2] - 2026-07-16

### Technical
- Updated GitHub Actions: actions/setup-node (6 → 7), actions/setup-go (6 → 7).
- Updated frontend dev dependencies: @types/node (25.9.5 → 26.1.1), vite (8.1.4 → 8.1.5), @tailwindcss/postcss (4.3.2 → 4.3.3), autoprefixer (10.5.2 → 10.5.4).

## [1.5.1] - 2026-07-13

### Security
- Resolved Dependabot security alerts in frontend by updating vulnerable transitive dev dependencies within their declared ranges: undici (7.25.0 → 7.28.0, fixes SOCKS5 ProxyAgent TLS bypass, HTTP header injection via Set-Cookie, cross-origin request routing, response queue poisoning, SameSite downgrade, and shared cache whitespace bypass), @babel/core (7.29.0 → 7.29.7, fixes arbitrary file read via sourceMappingURL comment), brace-expansion (5.0.5 → 5.0.7, fixes large numeric range DoS protection bypass), and vite (8.0.12 → 8.1.4, fixes NTLMv2 hash disclosure via UNC path and `server.fs.deny` bypass on Windows). No direct dependencies or `package.json` changes required.

## [1.5.0] - 2026-06-09

### Changed
- The vote summary (distribution of points) is now shown to all players after the dealer reveals the round, not just to the dealer.

## [1.4.2] - 2026-06-02

### Fixed
- Fixed Dependabot configuration by removing redundant root Docker entry.
- Synchronized frontend `package-lock.json` version with `package.json`.

## [1.4.1] - 2026-06-02

### Changed
- Dependabot update frequency increased from weekly to daily.

## [1.4.0] - 2026-06-02

### Changed
- Improved dealer's vote summary with a more readable horizontal layout (e.g., "3 × [Card]") to reduce eye movement.

## [1.3.0] - 2026-05-31

### Technical
- Updated frontend dependencies: react (19.2.6), react-dom (19.2.6), @types/react (19.2.15), tailwindcss (4.3.0), vite (8.0.12), @tailwindcss/postcss (4.3.0), typescript-eslint (8.60.0).
- Updated backend dependencies: golang Docker image (1.26.3-alpine).
- Updated frontend Docker image: node (26-alpine).

### Documentation
- Implemented Git Flow guidelines and AI agent instructions.

## [1.2.0] - 2026-05-05

### Added
- Documentation specifying Git Flow usage and requirements for documentation updates.
- `AGENTS.md` file with guidelines for AI agents.

### Changed
- Updated `CONTRIBUTING.md` and `README.md` to reflect Git Flow branching model.

### Fixed
- Prevented dealer from un-afking other players.
- Synchronized AFK button animation and styling with voted cards.

## [1.1.0] - 2026-05-05

### Added
- Server-side ID generation for improved security.
- Rate limiting for WebSocket connections.

## [1.0.0] - 2026-05-05

### Added
- Vote summary component for the dealer to see a breakdown of votes.

## [0.9.1] - 2026-05-05

### Technical
- Modularized frontend code by extracting hooks and components.
- Cleaned up backend state management for better stability.

## [0.9.0] - 2026-05-05

### Added
- AFK mode allowing players to temporarily opt-out of voting.
- Dealer ability to toggle AFK status for any player via the UI.

### Changed
- Extracted `UserStatus` component for better player list management.
- Improved layout stability in the participant list.

## [0.8.1] - 2026-05-05

### Changed
- Renamed "Participants" to "Players" in the UI.
- Removed scroll height limit from the player list container.

## [0.8.0] - 2026-05-05

### Added
- Dealer role with management capabilities and UI notifications.

### Technical
- Major frontend dependency upgrades: React 19, Vite 8, ESLint 10, Tailwind CSS 4.
- Updated Node.js to 25-alpine and Go to 1.26.2-alpine in Docker builds.
- Integrated Dependabot for automated dependency management.

## [0.7.0] - 2026-04-21

### Added
- Alphabetical sorting (case-insensitive) for participants in the room state.

## [0.6.0] - 2026-04-21

### Added
- Persistent user IDs via localStorage and server-side connection deduplication.

## [0.1.0] - 2026-04-21

### Added
- Initial implementation of real-time multi-room Scrum Poker application.
- Docker support for both frontend and backend.
- Comprehensive project documentation.
- Custom branding with new logo and favicon.
- "Backlog Royale" rebranding.

### Changed
- Major UI overhaul: playing card style cards, consolidated voting controls, and improved layouts.
- Replaced browser alerts with modern toast notifications (sonner).
- Improved mobile responsiveness for header separators.

### Fixed
- Issue where selected cards were not resetting between rounds.
- Properly ignored binaries in Go backend.

### Technical
- Updated Go module path to `github.com/j-stechmann/backlog-royale`.
- Switched license to GPLv2.
