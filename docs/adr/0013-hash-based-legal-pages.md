# 0013. Hash-based legal pages (no router)

**Status:** Proposed
**Date:** 2026-09-05

## Context

Operating a website publicly in Germany requires legally mandated pages — an imprint (§ 5 DDG, § 18(2) MStV) and a privacy policy (GDPR, § 25 TDDDG for the localStorage usage). The version badge in the bottom-right corner of every view was identified as the natural anchor: legal links should live next to it, and the pages themselves must be reachable via a stable URL.

The frontend deliberately has **no router** — the documented stance of the architecture ([Frontend architecture](../architecture/frontend.md): "no state-management library, no router, and no global store") — and room navigation works via the `?room=` query parameter plus `history.pushState`. Adding a router dependency for two static pages would contradict that decision.

There is also a deployment constraint: the frontend container serves **static files only** (nginx, no SPA fallback, no runtime configuration). Path-based routes (`/imprint`) would work on the Vite dev server but 404 in the production image — a trap that only appears after deployment.

## Decision

Legal pages (Imprint, Privacy Policy) are static React components rendered when `window.location.hash` matches `#/imprint` or `#/privacy`. A tiny `useHashRoute` hook (~40 lines, no dependency) parses the hash leniently, listens to `hashchange` and `popstate`, and exposes `route`/`navigate`. Unknown hashes resolve to "not on a legal page", so stale links cannot trap users.

Sub-decisions:

- **Hash routes, not path routes:** the fragment never reaches the server, so `/#/imprint` works identically on the dev server, `vite preview`, and the static nginx image — no server config, ever.
- **Footer links are origin-absolute and query-free** (`origin + pathname + '#/route'`), not bare relative hashes: from an in-game tab a bare `href="#/imprint"` would resolve against the full URL and the new tab would inherit `?room=`, silently auto-joining the room as a duplicate player. Links open in a **new tab** so a live game is never navigated away.
- **`joinRoom` serializes the URL without the fragment** (`pathname + search`): the previous `pushState(new URL(location.href))` preserved any hash, so a leftover `#/imprint` would have re-covered the game view right after joining.
- **The game view stays mounted underneath is not attempted** — a legal route replaces the view tree entirely (toasts aside). Rooms are ephemeral and reconnecting is one click; simplicity wins.

## Alternatives

- **Path routes + react-router (or `history`-based routing):** rejected — adds a dependency the project explicitly avoided, and path routes 404 on the static frontend image (no SPA fallback). Would require nginx `try_files` config or a host-level rewrite for every self-hosted deployment.
- **Conditional rendering on `location.pathname` without a router library:** rejected — same 404 problem in production; only hash-based "routing" is hosting-independent.
- **Query parameter (`?view=imprint`):** rejected — collides conceptually with `?room=` (the only URL state today), and would be sent to the server on every request; the fragment is client-only.
- **Separate legal HTML files shipped by nginx:** rejected — duplicates theming, breaks dark mode without script duplication, and drifts from the app.

## Consequences

- **Good:** zero dependencies; legal pages work on every hosting shape (dev, preview, static nginx, self-hosted behind any proxy); direct links and browser back/forward work; the no-router stance is preserved and the URL handling (`?room=` + hash) stays orthogonal.
- **Bad / accepted:** hash URLs are less pretty (`/#/imprint`) and invisible to servers (no access-log insight into legal-page visits — harmless here, since access logging is disabled anyway). `useHashRoute` is a third URL-sensitive hook alongside `useGameState` (search params) and `useBacklogRoyale` (URL derivation); its behavior is covered by tests.
- If a real router is ever introduced (e.g., for more views), this hook is the candidate for replacement, and the legal routes move to real paths — at which point the frontend image needs an SPA fallback.

## References

- `frontend/src/hooks/useHashRoute.ts`, `frontend/src/components/Footer.tsx`, `frontend/src/components/LegalPage.tsx`, `frontend/src/components/Imprint.tsx`, `frontend/src/components/PrivacyPolicy.tsx`, `frontend/src/hooks/useGameState.ts` (`joinRoom` fragment strip)
- [Frontend architecture — no-router stance](../architecture/frontend.md) and the `history.pushState` shareable-link mechanism
- [Self-hosting — static frontend image](../guides/self-hosting.md#images)