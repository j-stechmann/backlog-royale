# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

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
