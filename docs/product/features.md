# Features

The complete feature catalog. Each feature lists where it is implemented (file paths are from the repository root) and the user-facing behavior. The underlying mechanics are in [Game rules](game-rules.md) and the [architecture docs](../architecture/overview.md).

## Real-time collaboration

Every action (vote, reveal, reset, role change, disconnect) is processed by the server and immediately broadcast as a full room state to all participants. There is no polling, no lag-inducing intermediary, and no delta compression — clients always hold a complete, consistent snapshot.

- Implemented by: `backend/room.go` (`Run`, `broadcastStateLocked`), `frontend/src/hooks/useBacklogRoyale.ts`.
- Status: shipped (v0.1.0).

## Room-based sessions

Any room name forms an instant session — no creation step, no auth, no lobby. Sharing the room name (or the URL, which carries `?room=`) is all it takes to bring someone in. Empty rooms are destroyed automatically.

- Implemented by: `backend/hub.go` (`GetOrCreateRoom`), `backend/room.go` (empty-room teardown).
- The URL is updated via `history.pushState` on join (`frontend/src/hooks/useGameState.ts`).
- Status: shipped (v0.1.0).

## Story pointing cards

The standard Fibonacci set **1, 2, 3, 5, 8, 13, 21**, plus:

- the **"?" card** — "I have no idea / not enough information";
- the **"A" (Abstain) card** — a formal opt-out that still counts toward voting progress (shipped v1.7.0).

Cards render in a playing-card style with value-band colors (emerald ≤3, blue ≤8, rose ≤21, gray for "?"/"A") and hover lift; the selected card lifts higher with a ring. The abstain card is drawn with a Ban icon and is centralized as `ABSTAIN_VALUE` in `frontend/src/constants.ts`.

- Implemented by: `frontend/src/components/Card.tsx`, `CardFace.tsx`, `frontend/src/utils/theme.ts`.
- The valid vote set is enforced server-side in `backend/room.go` (`allowedVotes`).
- Status: shipped (v0.1.0; abstain v1.7.0).

## Hidden votes until reveal

Votes are hidden until someone reveals. This is enforced **server-side** — the server never transmits hidden votes, so they cannot be read from devtools before a reveal (see [ADR 0005](../adr/0005-server-side-vote-secrecy.md)). Before the reveal, only `hasVoted` flags are visible, along with a subtle bounce animation on voted cards.

- Implemented by: `backend/room.go` (`getVisibleVote`), `frontend/src/components/UserStatus.tsx`.
- Status: shipped (v0.1.0).

## Vote reveal

Reveal shows every vote at once, replacing the voting grid with a **vote summary** (distribution of points, visible to everyone — shipped v1.5.0). Reveal is authorized for the dealer, or for any non-AFK player when no dealer is present.

- Implemented by: `backend/room.go` (`handleReveal`), `frontend/src/components/VoteSummary.tsx`, `frontend/src/components/PlayerList.tsx` (button).
- Status: shipped (v0.1.0; summary-to-all v1.5.0).

## Quick reset / next round

One click clears all votes and hides them for a fresh round, returning everyone to the voting grid. Same authorization model as reveal.

- Implemented by: `backend/room.go` (`handleReset`), `frontend/src/components/PlayerList.tsx` ("Next Round" button).
- Status: shipped (v0.1.0).

## Dealer role

Any player can become the dealer: the facilitator who sees voting progress, reveals, and resets — but deliberately **does not vote** (see [ADR 0006](../adr/0006-dealer-role-and-no-dealer-fallback.md)). Dealer takeover is always permitted: becoming dealer demotes the current dealer. The seat is vacated automatically when the dealer leaves, goes AFK, or steps down.

- Implemented by: `backend/room.go` (`handleToggleRole`, `dealerID`), `frontend/src/components/Header.tsx` ("Become Dealer").
- Status: shipped (v0.8.0).

## Dealer-free rounds

When no dealer is present, any **non-AFK** player can reveal results and start the next round, so ad-hoc sessions never deadlock. When a dealer *is* present, management is dealer-exclusive again. AFK users are excluded from round management in both modes.

- Implemented by: `backend/room.go` (`handleReveal`/`handleReset` fallback branch), `frontend/src/App.tsx` (`canManageRound`).
- Status: shipped (v1.6.0).

## AFK mode

Players can step out without leaving the room. Going AFK clears the player's vote, removes them from voting progress, and excludes them from round management. Only the player themselves can return from AFK — the dealer cannot drag someone back into a vote (v1.2.0 fix); the dealer *can* send other players AFK from the player-list hover control.

- Implemented by: `backend/room.go` (`handleToggleAFK`), `frontend/src/components/UserStatus.tsx` (dealer hover overlay), `frontend/src/components/Header.tsx` and `VotingPanel.tsx` (AFK panel).
- Status: shipped (v0.9.0; dealer-managed AFK v0.9.0; un-AFK restriction v1.2.0).

## Voting progress

The player list header shows `x / y Voted` counting players only (dealer and AFK players are excluded). The "Reveal Results" button is disabled in the UI until every player has voted.

- Implemented by: `frontend/src/components/PlayerList.tsx`, driven by the `hasVoted` flags in each `STATE`.
- Status: shipped (v0.1.0).

## Vote summary (distribution)

After a reveal, votes are shown as a distribution — `3 × 5`, `2 × 8` — with the same card-face styling as the voting screen. Cards are sorted by count, with ties broken by card-deck order so equal counts always appear in the same order as on the voting screen (v1.9.0 fix). No average, no "consensus" value — see [ADR 0007](../adr/0007-distribution-only-vote-summary.md).

- Implemented by: `frontend/src/components/VoteSummary.tsx`.
- Status: shipped (v1.0.0 dealer-only; v1.5.0 all players; v1.4.0 horizontal layout; tie-break v1.9.0).

## Shareable links

The header has a one-click "copy invite link" button (with toast feedback). Because the room ID lives in the URL, joining is a link-click away. Display names persist in `localStorage` so returning joiners only need one click.

- Implemented by: `frontend/src/components/Header.tsx` (`copyLink`), `frontend/src/hooks/useGameState.ts` (`localStorage: backlog_royale_name`).
- Status: shipped (v0.1.0).

## Persistent identity (per browser)

The server assigns each connection a random ID and the client remembers the latest one in `localStorage`. This powers the room-switch eviction mechanism (`prevId`) described in [the architecture docs](../architecture/backend.md#identity-and-deduplication). It is not an account and not an authentication token.

- Implemented by: `frontend/src/hooks/useGameState.ts`, `backend/client.go` (`generateID`).
- Status: shipped (v0.6.0; server-side generation v1.1.0).

## Alphabetical player list

Participants are sorted case-insensitively by name in every state broadcast, so the list is stable and predictable for everyone.

- Implemented by: `backend/room.go` (`broadcastStateLocked` sort).
- Status: shipped (v0.7.0).

## Responsive design

The layout works on desktop and mobile: cards resize down, header actions collapse to icons on narrow screens, controls stack. Optimized for the "someone forgot their laptop" use case.

- Implemented by: Tailwind responsive variants across `frontend/src/components/`.
- Status: shipped (v0.1.0; header separator fix v0.1.0; player-list scroll fix v0.8.1).

## Dark theme with OS-preference switching

Three modes — light, dark, and system (follows the OS `prefers-color-scheme`). The choice persists in `localStorage`; an inline pre-paint script prevents a flash of the wrong theme; the whole UI is driven by semantic color tokens (see [ADR 0009](../adr/0009-semantic-tokens-and-dark-theme.md)).

- Implemented by: `frontend/src/hooks/useTheme.ts`, `frontend/src/components/ThemeToggle.tsx`, `frontend/src/index.css`, inline script in `frontend/index.html`.
- The toast stack follows the theme too (`<Toaster theme={...}>`).
- Status: shipped (v1.9.0).

## Version indicator

The app version (from `frontend/package.json`, injected at build time) is displayed as a small unobtrusive label in the bottom-right corner on all views, including the join screen — so bug reports are self-identifying.

- Implemented by: `frontend/vite.config.ts` (`define: { __APP_VERSION__ }`), `frontend/src/App.tsx`.
- Status: shipped (v1.8.0).

## Legal pages

The app ships legally required pages for public operation: an **Imprint** and a **Privacy Policy**, reachable at `/#/imprint` and `/#/privacy` via hash routing (no router dependency — see [ADR 0013](../adr/0013-hash-based-legal-pages.md)). Links sit in the bottom-right footer next to the version label and always open in a new tab, so a live game is never navigated away; on the legal pages a "Back" link returns to the app. The footer links are built origin-absolute without the query string, so opening them from an in-game tab cannot auto-join the current room in the new tab. The shipped content reflects the production deployment (backlog-royale.com); self-hosters must provide their own legal content ([Self-hosting](../guides/self-hosting.md#legal-compliance)).

- Implemented by: `frontend/src/hooks/useHashRoute.ts`, `frontend/src/components/LegalPage.tsx`, `Imprint.tsx`, `PrivacyPolicy.tsx`, `Footer.tsx` (links), `frontend/src/hooks/useGameState.ts` (`joinRoom` strips the fragment).
- Status: unreleased.

## Rate limiting and connection hygiene

Two independent token buckets: per-IP HTTP rate limiting (429 on excess) and per-connection WebSocket message rate limiting (drops excess messages with no client feedback — the server logs a warning). Plus ping/pong keepalive, a 512-byte message cap, and server-enforced timeouts. Details in [Security](../architecture/security.md).

- Implemented by: `backend/main.go` (`securityMiddleware`, `getIPLimiter`), `backend/client.go` (`rateLimiter`, `readPump`, `writePump`).
- Status: shipped (v1.1.0).

## Clean room transitions

Switching rooms is ghost-free: the client sends its previous server-assigned ID as `prevId`, and the server evicts the stale connection from the old room even if the old WebSocket has not closed yet. Additional tabs in the same room are unaffected — with one known sharp edge: a second tab that joins by *submitting the join form* (rather than opening the room URL) sends the shared localStorage ID and evicts the first tab's connection, which then reconnects fresh. Coexistence is guaranteed for the URL/auto-join and reconnect paths.

- Implemented by: `frontend/src/hooks/useGameState.ts` (`prevIdToEvict`), `backend/hub.go` (`EvictClient`), `backend/room.go` (evict channel).
- Status: shipped (v1.9.0).

## Reconnect handling

Dropped connections show a "Reconnecting..." pill and reconnect automatically after 3 seconds with a fresh identity; the stale participant row is cleaned up server-side. A generation counter keeps stale socket handlers from interfering across room switches or StrictMode remounts.

- Implemented by: `frontend/src/hooks/useBacklogRoyale.ts` (`genRef`, reconnect timer), `frontend/src/components/Header.tsx` (live pill).
- Status: shipped (v0.1.0; generation counter v1.9.0).

## Feature index by release

| Release | Feature |
| :--- | :--- |
| 0.1.0 | Real-time rooms, voting cards, reveal/reset, toasts, Docker, branding |
| 0.6.0 | Persistent user IDs (localStorage) + server-side connection dedup |
| 0.7.0 | Alphabetical participant sorting |
| 0.8.0 | Dealer role; major dependency upgrades |
| 0.9.0 | AFK mode; dealer-managed AFK |
| 1.0.0 | Vote summary (dealer only) |
| 1.1.0 | Server-side ID generation; rate limiting |
| 1.2.0 | Git Flow + agent guidelines; un-AFK restriction; AFK button polish |
| 1.4.0 | Horizontal vote summary layout |
| 1.5.0 | Vote summary visible to all players |
| 1.6.0 | Dealer-free rounds (players can reveal/reset) |
| 1.7.0 | "A" (Abstain) card |
| 1.8.0 | Version indicator |
| 1.9.0 | Dark theme + semantic tokens; clean room transitions (`prevId`); multi-tab coexistence |
| 1.9.2 | Docker builder bumped to Go 1.27 |
| Unreleased | Automated dependency merging (grouped PRs + auto-merge); Go 1.27 alignment (go.mod, CI, Docker); legal pages (Imprint, Privacy Policy) |