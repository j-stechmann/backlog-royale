# 0015. Lighthouse performance gate in CI

**Status:** Accepted
**Date:** 2026-09-27

## Context

CI verified that the frontend *builds* and its units pass, but nothing measured the quality of what ships: a regression in bundle size, render path, or accessibility would sail through every gate. Google PageSpeed Insights — the tool people actually quote — cannot gate PRs directly: it scores a deployed public URL and requires an API key, and PRs have neither. The engine behind PSI, however, is open-source Lighthouse, which can run anywhere against a local build.

The app is a plain Vite SPA served by nginx; LHCI's built-in static server is therefore a faithful stand-in for the real serving path (static files, no server-side rendering), making a local Lighthouse run representative of production without needing the full `docker-compose` stack or the Go backend (the game itself is WebSocket-bound; what Lighthouse scores is the load path of the static shell).

## Decision

1. **Run Lighthouse CI (the `@lhci/cli` wrapper around Lighthouse) as a fourth CI job**, hard-gating every PR the same way the `backend`/`frontend`/`docker` jobs do. Chrome is preinstalled on `ubuntu-latest`; the job is `npm ci` → `npm run build` → `lhci autorun`.
2. **Score the built `dist/` via LHCI's static server**, not the Docker stack — the SPA is fully static; a static server reproduces the scored surface exactly and keeps the job fast.
3. **Gate all four categories (performance, accessibility, best-practices, SEO) at ≥ 0.9**, error-level, in `frontend/lighthouserc.json`.
4. **Assert on the median of 3 runs.** Single-run performance scores on shared runners swing by tens of points (calibration observed 68→96 for identical code); the median absorbs an outlier run without letting real regressions through.
5. **Upload every run's HTML/JSON report as a CI artifact** so a failed gate is diagnosable from the run page. LHCI's own `upload` step (temporary-public-storage) is deliberately **not** configured: its purpose is LHCI's optional GitHub-status integration, which would want a `GITHUB_TOKEN` (the healthcheck warns "GitHub token not set" otherwise). That integration is redundant here — the gate is the required `lighthouse` check and reports persist as artifacts anyway.
6. Thresholds live in `frontend/lighthouserc.json` (checked into the repo), not inline in the workflow — the config is locally runnable (`npx @lhci/cli autorun` from `frontend/`) and is the single source of truth.

## Alternatives

- **PageSpeed Insights API in CI:** needs a deployed URL and an API key; there is no per-PR deployment, so it cannot gate merges. (PSI's *results* would also come from Lighthouse's mobile throttling — not reproducible on a runner.)
- **Informational-only Lighthouse (no gate):** scores drift the moment nothing enforces them; the first regression is free.
- **Per-run assertion:** simplest, but fails on runner noise — a flaky 68/100 run of otherwise-95 code would block merges randomly.
- **Performance category only:** the PageSpeed headline, but the other three categories are free to measure and the app already meets 100 on all three; gating one category while ignoring free enforcement elsewhere buys nothing.
- **WebPageTest / synthetic monitoring of the deployed site:** valuable someday for the *deployed* instance, but it is a monitoring concern, not a merge gate.
- **LHCI's GitHub-status integration (with `upload: temporary-public-storage` + token):** tried first; dropped — it duplicates the required `lighthouse` check, posts a *second* status nobody needs, and nags for a `GITHUB_TOKEN` it does not need.

## Consequences

- **Good:** bundle-size or render-path regressions now fail CI; accessibility and SEO regressions (including missing meta tags) fail CI; the gate is the same engine as the PSI scores people compare against; reports are one artifact download away.
- **Bad / accepted:** the runner environment differs from PSI's mobile-throttled lab — the gate is a floor, not a guarantee of PSI's exact numbers; performance scores near the threshold will occasionally need a re-run on a noisy runner (median-of-3 keeps this rare); LHCI is another devDependency-class tool pinned by version in the workflow, updated like any other dependency.
- A first calibration run on v1.10.5 scored **95–96 performance, 100/100/100** on the other categories — the 0.9 floor has headroom.

## References

- [CI/CD](../operations/ci-cd.md) — the `lighthouse` job; `frontend/lighthouserc.json` — thresholds
- [ADR 0010](0010-dependency-automation.md) — required-checks/branch-protection mechanics; [ADR 0014](0014-solo-maintainer-branch-protection.md) — the CI gate as the sole protection on `main`
- Lighthouse CI docs: https://github.com/GoogleChrome/lighthouse-ci