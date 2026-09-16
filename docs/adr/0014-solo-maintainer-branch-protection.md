# 0014. Solo-maintainer branch protection

**Status:** Accepted
**Date:** 2026-09-08

## Context

The branch protection model from [ADR 0010](0010-dependency-automation.md) required one human approval for every PR against `main`, on top of the green CI checks required everywhere ("production is never updated automatically"). The project has exactly one maintainer (`j-stechmann`), who is also the repository admin. GitHub forbids approving your own pull request, so the approval requirement could never be satisfied by the person the gate was meant to protect — the only way to release was `gh pr merge --admin`, an override that also disables *all* protection for the merge. The release of v1.10.1 (2026-09-08) hit exactly this: a release PR with green CI that could only be merged via admin override of the approval rule it did not need to bypass.

An approval gate is a tool for a team: a second pair of eyes catches what CI cannot and spreads knowledge of production changes. With a maintainer-count of one, it provided neither — only friction in the happy path and a misleading sense of a second opinion.

## Decision

1. **Drop the approval requirement on `main`.** Branch protection keeps the `backend`/`frontend`/`docker` required checks (strict, up-to-date branches) — identical to `develop`. Production is still *never updated automatically*: the auto-merge workflow only targets `develop`, and merges to `main` are always an explicit, manual act by the maintainer (release or hotfix PRs).
2. **Enable "include admins"** on `main` so the remaining CI gate cannot be bypassed by admin merge buttons — protection is real for the one person who has admin rights, not nominal.
3. **Supersede, don't edit:** ADRs 0010 and 0012 keep their original text and gain an inline supersession note pointing here; ADRs are immutable once accepted.
4. If a second maintainer ever joins, this decision should be revisited — the approval gate becomes meaningful again the moment there is someone to give it.

## Alternatives

- **Keep the approval gate:** every release would require an admin override, i.e., permanently operating in bypass mode — the gate would exist only to be broken.
- **Machine-user/bot approval (second PAT):** the "second approval" would be controlled by the same person — ceremony and a false audit trail, not review.
- **Drop branch protection on `main` entirely:** rejected; the CI gate plus no-force-push/no-delete rules still guard the production branch, and auto-merge must never gain a path to it.
- **Move to GitHub Flow (PRs straight to `main`):** orthogonal — this changes who can merge, not which branch integration happens on ([ADR 0012](0012-git-flow.md) remains in force).

## Consequences

- **Good:** releases and hotfixes merge without dead friction; CI (including the Docker smoke test) remains the enforced gate on `main`; protection applies to admins, so the gate is no longer circumventable with a click; the documented policy matches reality.
- **Bad / accepted:** nothing on `main` is ever reviewed by anyone other than the author — correctness rests entirely on CI plus maintainer review of their own work; the CHANGELOG and release notes are the only second record of what shipped.

## References

- [ADR 0010](0010-dependency-automation.md) (dependency automation; supersession note added), [ADR 0012](0012-git-flow.md) (Git Flow; supersession note added)
- [Release process](../development/release-process.md), [CI/CD](../operations/ci-cd.md), [Dependency management](../development/dependencies.md)
- CHANGELOG `[Unreleased]` (2026-09-08 change); v1.10.1 release PR #115 (the trigger)