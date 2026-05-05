# Changelog

All notable changes to this project will be documented in this file.

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
