# Frontend Architecture

The frontend lives in `/frontend`: Vite + TypeScript + React 19 + Tailwind CSS 4. All state lives in custom hooks — there is no state-management library, no router, and no global store.

## File map

```text
src/
├── App.tsx                 orchestration, role-change toasts, version footer
├── main.tsx                entry (StrictMode)
├── index.css               Tailwind v4 + semantic color tokens + animation
├── constants.ts            cards, roles, actions, message types
├── global.d.ts             __APP_VERSION__ declaration
├── hooks/
│   ├── useGameState.ts     app-level state (room, name, join, prevId)
│   ├── useBacklogRoyale.ts WebSocket connection + reconnection
│   └── useTheme.ts         light/dark/system theme
├── components/
│   ├── JoinView.tsx        room + name form
│   ├── Header.tsx          room ID, share link, AFK/dealer toggles, live pill
│   ├── VotingPanel.tsx     AFK panel | summary | dealer panel | card grid
│   ├── PlayerList.tsx      progress + reveal/next-round controls + rows
│   ├── UserStatus.tsx      per-player glyph, dealer AFK hover control
│   ├── Card.tsx / CardFace.tsx  playing-card UI, abstain icon
│   ├── VoteSummary.tsx     count × card distribution
│   ├── ThemeToggle.tsx     shared light/dark/system segmented control
│   └── Logo.tsx            SVG card + crown
├── utils/theme.ts          vote-band color mapping
└── test/setup.ts           jest-dom
```

## Hooks

### `useGameState` — application state

- Reads the room ID from the URL and name/ID from `localStorage` at startup; `isJoined` is true when the URL carries a room and a saved name exists (one-click rejoin).
- `joinRoom(roomID, name)` persists the name, rewrites the URL via `history.pushState` (shareable links, no router), and sets `isJoined`.
- Owns the `prevIdToEvict` lifecycle: set from the current ID on any `joinRoom` call (a room switch or a first-time form-join), cleared when the new connection's `WELCOME` arrives. Sending the shared localStorage ID on *every* connection would make a second tab evict the first — the reason this is a state field and not unconditional ([ADR 0008](../adr/0008-eviction-via-room-channel.md)).
- Implements the [derived-state reset heuristic](#derived-state-reset-heuristic).

### `useBacklogRoyale` — the WebSocket

- **URL derivation:** `VITE_WS_URL` if set; otherwise `wss/ws://` + host. On `localhost` the default host is `localhost:8080` (backend port) so local Docker Compose works without configuration; elsewhere `window.location.host`, i.e. production assumes a reverse proxy routing `/ws` to the backend (see [Self-hosting](../guides/self-hosting.md)).
- **Message handling:** `STATE` → state snapshot; `WELCOME` → ID callback (stored in `localStorage`, clears `prevIdToEvict`). Everything is strictly typed interfaces (`User`, `RoomState`) mirroring the backend structs.
- **Generation counter (`genRef`):** each socket captures a monotonically increasing generation. Cleanup increments the counter and closes the socket; a stale `onclose` compares generations and bails before triggering `setConnected(false)` or the reconnect timer. This eliminates spurious reconnects when switching rooms and is safe under React 19 StrictMode double-mounting.
- **Reconnect:** fixed 3-second delay, no backoff. Each retry opens a fresh connection with a new server-assigned ID; the stale participant row is removed server-side when the old socket's `unregister` is processed.
- `prevId` is kept in a ref rather than a hook dependency so that receiving a `WELCOME` (which stores a new ID) does not itself retrigger a connection.
- `sendAction(type, payload)` serializes and sends only when the socket is `OPEN`.

### `useTheme` — theming

Three modes (`light` | `dark` | `system`), persisted under `localStorage` key `backlog_royale_theme`; invalid values normalize to `system`. While in system mode the hook subscribes to `prefers-color-scheme` changes; the resolved theme toggles the `.dark` class on `<html>`. An inline pre-paint script in `index.html` applies the class before React mounts to avoid a flash of the wrong theme (deployments with a strict CSP must allow that inline script — see [Configuration](../reference/configuration.md)). The resolved theme is derived state, not an effect, so there is no cascading render.

## Components

| Component | Responsibility |
| :--- | :--- |
| `App.tsx` | Orchestration: joins state, role-change toasts ("You are now the Dealer/AFK/Player"), vote/reveal/reset handlers, version footer, sonner `<Toaster>` (receives the theme so toasts follow light/dark). |
| `JoinView` | Room + display name form; reads `?room=` from the URL so shared links prefill. |
| `Header` | Room ID, copy-invite-link button, AFK and Dealer toggles with active/inactive styling, live/reconnecting pill, `ThemeToggle`. |
| `VotingPanel` | Renders one of four states by role/phase: AFK notice, vote summary (after reveal), dealer notice, or the card grid. |
| `PlayerList` | Voting progress (`x / y Voted`, players only), Reveal/Next-Round buttons for those authorized, per-player rows. |
| `UserStatus` | Per-player status glyph: dealer hand, AFK coffee, revealed vote card, voted checkmark, or an empty dashed slot; hover overlay lets the dealer send a player AFK. Voted players bounce subtly before the reveal. |
| `Card` / `CardFace` | Playing-card UI. `CardFace` renders the "A" abstain card as a Ban icon (`ABSTAIN_VALUE` sentinel centralized in `constants.ts`). |
| `VoteSummary` | Distribution as `count × card`, sorted by count with ties broken by `CARD_VALUES` order (matches the voting screen order). |
| `ThemeToggle` | Shared segmented control used in both the header and the join screen (`role="group"` + `aria-pressed`, a plain-button pattern chosen over a `radiogroup` that lacked the arrow-key pattern). |
| `Logo` | SVG card + crown; card chrome reads raw CSS variables (`var(--surface)`, …) because Tailwind's `@theme inline` does not emit `--color-*` variables to `:root`. Crown and jewels are fixed brand colors. |

## Derived-state reset heuristic

The server does not push a dedicated "round reset" event. Instead `useGameState` watches each `STATE`: if the voted-count drops to zero after having been positive, or `reveal` flips from true to false, the locally selected card is cleared. This keeps the optimistic UI in sync with dealer-initiated resets. It is a heuristic rather than protocol — worst case it merely clears a local card selection.

## Theming and semantic tokens

- 22 semantic CSS color tokens (`base`, `surface`, `surface-2/3`, `surface-inverse`, `surface-highlight`, `line`, `glass`, `content`, `content-soft`, `mid-text`, `muted`, `content-inverse`, `accent`, `accent-text`, `accent-strong`, `accent-soft`, `warn`, `warn-strong`, `warn-soft`, `ok`, `danger`) are defined as raw `:root` variables with a single `.dark` override block, exposed to Tailwind v4 via `@theme inline` (so `bg-surface`, `text-content`, `border-line`, … work everywhere). Full rationale in [ADR 0009](../adr/0009-semantic-tokens-and-dark-theme.md).
- Components consume semantic utilities only; dark mode is a variable swap, not scattered `dark:` classes (the vote-band utility strings in `src/utils/theme.ts` are the deliberate exception, since they encode per-card hue rather than surface semantics).
- **Vote-band colors** (`getTheme`): ≤3 points → emerald, ≤8 → blue, ≤21 → rose, `?`/`A`/unknown → gray; each band carries text/bg/border/ring/shadow/hoverBorder with `dark:` variants (the point bands use `-900` backgrounds in dark mode so hue stays visible on the dark surface; the gray band uses `-800`).
- Accessibility decisions: `accent` (surfaces, blue-600 both modes) is split from `accent-text` (on-surface text/icons, blue-600/blue-400) to keep WCAG AA contrast; `accent-strong`/`warn-strong` provide hover and active states; the "voted" checkmark is a dark glyph on the green pill.

## Connection lifecycle

```text
join ──► connect ──► WELCOME (store ID) ──► STATE loop ──► (close?)
               ▲                                        │
               └──────── 3 s reconnect ◄────────────────┘
```

- **On close:** if the socket's generation is still current, mark disconnected and schedule a reconnect in 3 s. Stale sockets (generation mismatch) do nothing.
- **On room switch:** cleanup closes the socket and bumps the generation; the new connection carries `prevId` so the server evicts the ghost from the old room.
- **Multi-tab:** additional tabs of the same room never send `prevId`, so they do not evict each other. Sharp edge: `joinRoom` sets `prevIdToEvict` unconditionally, so a second tab that *submits the join form* (open URL without `?room=`, type a name, join) sends the shared localStorage ID and evicts the first tab's live connection — it reconnects fresh a moment later. Only the URL/auto-join and reconnect paths are guaranteed coexistence.

The server-side half of this lifecycle is in [Backend architecture](backend.md#identity-and-deduplication); the wire format is in the [protocol reference](../reference/protocol.md).

## Build-time version injection

`vite.config.ts` injects `__APP_VERSION__` from `frontend/package.json` via `define`; `App.tsx` renders it as a small fixed label on every view ([Features](../product/features.md#version-indicator)).