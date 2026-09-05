# 0009. Semantic color tokens and dark theme

**Status:** Accepted
**Date:** 2026-08-21 (v1.9.0); documented 2026-09-05

## Context

The UI was styled with hardcoded Tailwind palette utilities (`bg-gray-50`, `text-blue-600`, …). Adding a dark theme on top would have meant a `dark:` variant on *every* color class across every component — a maintenance explosion and a guarantee of drift between light and dark palettes. WCAG AA contrast also needed deliberate handling: several existing combinations (white on green-500 checkmarks, accent borders on accent-soft backgrounds) had failing or zero contrast.

## Decision

Introduce **22 semantic color tokens** as raw CSS variables with a single `.dark` override block, exposed to Tailwind v4 via `@theme inline` so they appear as normal utilities (`bg-surface`, `text-content`, `border-line`, …). Components consume only semantic utilities; dark mode is a variable swap.

Key sub-decisions:

- **Three theme modes** (light / dark / system) persisted in `localStorage` (`backlog_royale_theme`), with OS-preference subscription while in system mode, and an inline pre-paint script in `index.html` to prevent a flash of the wrong theme.
- **`accent` split** into `accent` (button surfaces, blue-600 in both modes) and `accent-text` (on-surface text/icons, blue-600/blue-400) to keep AA contrast in both themes; `accent-strong`/`warn-strong` provide hover/active states.
- **Vote-band colors stay in `utils/theme.ts`** as Tailwind utility strings with explicit `dark:` variants — the deliberate exception to semantic tokens, because they encode per-card hue (emerald/blue/rose/gray), not surface semantics.
- **Contrast fixes shipped with the theme:** the "voted" checkmark became a dark `emerald-950` glyph on the green pill (was white-on-green-500 at 2.28:1 — the earlier `text-content` fix only held in light mode); zero-contrast `*-soft` borders were replaced with `border-accent/30`/`border-warn/30`; hover states that were identical to base states were given real `*-strong` targets.
- The sonner `<Toaster>` moved into `App.tsx` to receive the theme, so toasts follow light/dark.

## Alternatives

- **`dark:` variants everywhere:** rejected — hundreds of scattered variants, guaranteed drift, and every new component needs double styling.
- **Tailwind's built-in `dark:` with palette colors only:** same explosion, plus the palette names would leak implementation detail into component code.
- **CSS-in-JS / CSS variables without Tailwind mapping:** loses the utility ergonomics and the project's Tailwind investment.
- **Favicon theming:** explicitly not done — favicons cannot be re-themed at runtime; documented as accepted.

## Consequences

- **Good:** dark mode is one variable block; new components get both themes for free; contrast decisions are centralized and testable; `@theme inline` keeps utilities tree-shakeable.
- **Bad / accepted:** the `@theme inline` mapping does not emit `--color-*` variables to `:root`, so raw-CSS consumers (the `Logo` SVG, `body` background) reference the raw variables directly — a documented two-layer mental model; the vote-band strings remain a second styling dialect by design.
- Known cosmetic follow-up: the logo crown's amber-700 stroke is low-contrast in dark mode (tracked in the v1.9.0 changelog notes).

## References

- `frontend/src/index.css` (tokens + `@theme inline`), `frontend/src/hooks/useTheme.ts`, `frontend/src/components/ThemeToggle.tsx`, `frontend/index.html` (pre-paint script), `frontend/src/utils/theme.ts`
- CHANGELOG v1.9.0 (full decision trail incl. token consolidation 23→22)
- [Architecture: Frontend — theming](../architecture/frontend.md#theming-and-semantic-tokens)