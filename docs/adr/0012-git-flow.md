# 0012. Git Flow branching model

**Status:** Accepted
**Date:** 2026-05-05 (v1.2.0); documented 2026-09-05

## Context

As automated dependency merging scaled up ([ADR 0010](0010-dependency-automation.md)), the project needed a branching model that (a) keeps a clean, releasable production history, (b) gives dependency PRs a safe integration target that is *not* production, and (c) defines an explicit release ceremony. Trunk-based development with tags-only releases left "what is actually deployed" ambiguous; the project adopted Git Flow when the documentation and agent guidelines were formalized (v1.2.0).

## Decision

Strict **Git Flow**:

| Branch | Role |
| :--- | :--- |
| `main` | Official release history; production |
| `develop` | Integration branch for features and dependency bumps |
| `feature/name` | New features / non-critical fixes; branched off `develop`; PRs target `develop` |
| `release/x.x.x` | Release preparation; branched off `develop`; merged into **both** `main` and `develop` |
| `hotfix/name` | Critical production fixes; branched off `main`; merged into **both** `main` and `develop` |

Supporting rules:

- PRs for features target `develop`; hotfix PRs target `main`.
- Branch protection: `develop` requires green CI (`backend`, `frontend`, `docker`); `main` additionally requires human approval — production is never updated automatically (see [ADR 0010](0010-dependency-automation.md)).
- Releases are cut by bumping versions (`frontend/package.json`), merging the `release/x.x.x` branch into `main`, then back into `develop`, and tagging — `docker-publish.yml` builds GHCR images on `main` pushes and `v*.*.*` tags.
- CI runs on pushes/PRs for both `main` and `develop` (extended in v1.6.1 to cover `develop` explicitly).

## Alternatives

- **GitHub Flow (everything through `main`):** simpler, but dependency auto-merge would touch production history, and release stabilization (changelog, version bumps) would happen on `main` itself.
- **Trunk-based with release tags:** even leaner, but loses the "release branch carries exactly release changes" property and assumes continuous deployment, which does not match the tag-driven Docker publishing flow.
- **No protected branches:** the auto-merge pipeline makes this untenable — automation needs a safe target that is definitionally not production.

## Consequences

- **Good:** `main` is always a releasable artifact; dependency churn never lands in production without a release merge; releases are a checklist, not an adventure; hotfixes have a defined lane that also reaches `develop`.
- **Bad / accepted:** ceremony overhead — two merge-backs per release, plus feature branches must rebase against an actively-moving `develop` (Dependabot's merge commits cause regular fast-forward churn); contributors must know the model (documented in [CONTRIBUTING](../../CONTRIBUTING.md) and [AGENTS.md](../../AGENTS.md)).

## References

- `AGENTS.md`, [CONTRIBUTING](../../CONTRIBUTING.md), `.github/workflows/ci.yml`, `.github/workflows/docker-publish.yml`
- CHANGELOG v1.2.0 (adoption), v1.6.1 (CI extended to `develop`)