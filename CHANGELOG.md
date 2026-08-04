# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

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
