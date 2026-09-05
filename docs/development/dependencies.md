# Dependency Management

The operating manual for the automation policy. The decision record is [ADR 0010](../adr/0010-dependency-automation.md); this page is the how-it-works for day-to-day work.

## The policy at a glance

| Update type | Delivery | Gate |
| :--- | :--- | :--- |
| npm production, minor/patch | Weekly, grouped PR | Auto-merge on green CI |
| npm development, minor/patch | Weekly, grouped PR | Auto-merge on green CI |
| gomod, minor/patch | Weekly, grouped PR | Auto-merge on green CI |
| Docker base images, minor/patch | Weekly, grouped PR | Auto-merge on green CI |
| GitHub Actions, minor/patch | Weekly, grouped PR | Auto-merge on green CI |
| **Any security update** | **Immediately, individual PR** | Auto-merge on green CI |
| **Any major update** | Weekly group is bypassed; individual PR | **Never auto-merged** — labeled `major`, manual review |
| `go` directive (all types) | **Never** by automation | Manual, via the triangle ([ADR 0011](../adr/0011-go-version-triangle.md)) |

PRs against `main` always require human approval — production is never updated automatically.

## How a week looks

1. Dependabot opens weekly grouped PRs across **five ecosystems** (npm, gomod, Docker frontend, Docker backend, GitHub Actions — cap of 10 open PRs each), producing up to **six grouped PRs per week**: one minor+patch group per ecosystem, except npm which is split into a production and a development group. Each group targets `develop`.
2. The `dependabot-auto-merge` workflow fetches PR metadata. If it is not a major bump, it enables auto-merge (`gh pr merge --auto --merge`).
3. The `backend`, `frontend`, and `docker` CI jobs run. Green → GitHub merges the PR with a merge commit; red → it stays open with the failure visible.
4. Security PRs skip the weekly schedule entirely and arrive one per advisory.

## The auto-merge workflow's safety properties

- Uses `pull_request_target` because Dependabot PRs get a read-only token under `pull_request` (auto-merge would 403). The workflow **never checks out or executes PR code** — it reads metadata and calls the API only, which is why the elevated trigger is safe.
- Triple guard: repository name (`j-stechmann/backlog-royale`), author `dependabot[bot]`, and `base.ref == develop`. Forks, humans, and `main`-targeting PRs are all out of scope.
- Majors are labeled `major` instead of merged.
- The `docker` CI job (build both images without pushing) is load-bearing: it is what validates base-image bumps before they can auto-merge.

## Manual procedures

### Adding / changing a dependency yourself

One commit with the regenerated lockfile, tests green, and a rationale in the PR description. Runtime dependencies (or new patterns) deserve an [ADR](../adr/README.md). See [Coding standards](standards.md#adding-a-dependency-either-side).

### Bumping Go

Bump **all three** places in one change: `backend/go.mod`, `go-version` in `ci.yml`, builder image in `backend/Dockerfile` — then README prerequisites. Dependabot will not do this for you; see [ADR 0011](../adr/0011-go-version-triangle.md).

### Untangling a bad grouped PR

If an auto-merged group breaks something after the fact: revert the merge commit on `develop` (revert, not revert-by-red-PR, keeps history linear), let Dependabot re-propose the individual bump when you are ready, and consider pinning the offending package in the relevant `ignore` block with a comment explaining why.

### When Dependabot seems stuck

- Check the open-PR cap (10 per ecosystem) — a pile of stale grouped PRs blocks new ones; close superseded PRs.
- Grouped PRs can linger red while one member of the group breaks; comment on the PR which member is the problem or close and let the next weekly run re-group.
- Security PRs are never grouped; if one is open, it is the priority.

## Files that encode this policy

| File | Role |
| :--- | :--- |
| `.github/dependabot.yml` | Ecosystems, weekly schedule, groups, PR cap, the `go`-directive ignore (with rationale comments) |
| `.github/workflows/dependabot-auto-merge.yml` | The auto-merge / label-major workflow |
| `.github/workflows/ci.yml` | The three gates (`backend`, `frontend`, `docker`) |
| Branch protection (repo settings) | Required checks; approval on `main` |