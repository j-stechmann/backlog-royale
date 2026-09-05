# 0010. Automated dependency management

**Status:** Accepted
**Date:** 2026-05-05 (Dependabot introduced, v0.8.0); reworked 2026-06-02 (daily), 2026-08-30 (grouping + auto-merge); documented 2026-09-05

## Context

By v1.9.x the repository had accumulated dozens of Dependabot PRs per week — one per package — flooding review queues and training everyone to click merge blindly. Meanwhile three real problems emerged: security updates needed to land *fast*, major bumps needed a human, and the `go` directive kept drifting ahead of the toolchains pinned in CI and Docker (see [ADR 0011](0011-go-version-triangle.md)).

## Decision

A three-part policy (configured in `.github/dependabot.yml` + `.github/workflows/dependabot-auto-merge.yml`):

1. **Grouped weekly PRs:** one PR per ecosystem (npm split into production/development groups, gomod, Docker frontend/backend, GitHub Actions), containing minor+patch updates only, capped at 10 open PRs. Security updates bypass grouping and arrive immediately as individual PRs.
2. **Auto-merge for grouped PRs:** enabled via `gh pr merge --auto --merge` once CI is green. Majors are never auto-merged — they are labeled `major` for manual review. Guards: repository name, `dependabot[bot]` author, `base.ref == develop`.
3. **Branch protection:** all PRs require the `backend`/`frontend`/`docker` CI checks; PRs against `main` additionally require human approval — **production is never updated automatically**.
4. **Go directive:** Dependabot ignores *all* version updates of the `go` directive (major/minor/patch) — manual-only via the version triangle ([ADR 0011](0011-go-version-triangle.md)).

The `docker` CI job (build both images without pushing) exists specifically so base-image bumps are validated before they can merge.

## Alternatives

- **Per-package PRs (the previous state):** flood, review fatigue, silent blind merges.
- **Renovate:** more configurable, but a bigger platform commitment; Dependabot was already integrated and the grouping features it needed shipped.
- **No auto-merge at all:** the flood simply moves to manual merging of boring minor bumps — the review burden stays.
- **Auto-merge majors too:** rejected; majors can carry breaking changes the grouped-CI-green signal cannot judge (behavioral, not build-level).

## Consequences

- **Good:** maintenance is boring by construction — one predictable PR per ecosystem per week; security fixes stay urgent; majors get the human time they deserve; the workflow uses `pull_request_target` safely because it never checks out or executes PR code (read-only metadata + API calls only).
- **Bad / accepted:** grouped PRs bundle unrelated updates (bisecting a regression means untangling one); auto-merge relies on CI being a real gate — the Docker smoke-test job is load-bearing; the `pull_request_target` trigger is elevated and must never grow a code-checkout step.

## References

- `.github/dependabot.yml`, `.github/workflows/dependabot-auto-merge.yml`, `.github/workflows/ci.yml`
- CHANGELOG `[Unreleased]` (the rework), PRs #98/#99–#105 (first auto-merged waves)
- [Dependency management](../development/dependencies.md) (operator view), [CI/CD](../operations/ci-cd.md)