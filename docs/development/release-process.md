# Release Process

How a change goes from `develop` to a published release. Git Flow provides the rails ([ADR 0012](../adr/0012-git-flow.md)); this page is the checklist.

## Versioning

Semantic versioning, tracked in **two places** (keep them in sync):

- `frontend/package.json` — the version displayed in the UI footer (`__APP_VERSION__`).
- Git tag `vX.Y.Z` — what triggers image publishing and what the CHANGELOG dates anchor to.

The backend has no separate version file; its version *is* the repository release.

## What a release contains

Every `release/x.x.x` branch carries: the CHANGELOG section for the version (moved from `[Unreleased]`, dated), the `frontend/package.json` + `package-lock.json` version bump, and nothing else that isn't release-related. Feature work merges to `develop` before the release branch is cut.

## Checklist

```bash
# 0. Precondition: develop has everything that belongs in the release,
#    CI green on develop (backend, frontend, docker).

# 1. Cut the release branch
git checkout develop
git checkout -b release/1.9.3

# 2. Move the [Unreleased] CHANGELOG section to [1.9.3] - YYYY-MM-DD
#    (keep "Unreleased" in place if anything is still pending)

# 3. Bump the frontend version
cd frontend
npm version 1.9.3 --no-git-tag-version   # updates package.json + package-lock.json

# 4. Verify
npm ci && npm run test && npm run lint && npm run build
cd ../backend && go test -v ./...

# 5. Commit, push, open PR: release/1.9.3 -> main
git add . && git commit -m "chore(release): bump version to 1.9.3"
git push -u origin release/1.9.3
gh pr create --base main --title "Release 1.9.3"

# 6. After merge to main, merge back into develop (Git Flow requirement)
git checkout develop
git merge --no-ff release/1.9.3
git push origin develop

# 7. Tag (the merge commit on main)
git checkout main && git pull
git tag v1.9.3 && git push origin v1.9.3
```

Steps 6 and 7 are what publish: the tag triggers `docker-publish.yml`, which builds and pushes both images to GHCR with semver + SHA tags ([CI/CD](../operations/ci-cd.md)). Historically the release commit message is `Release x.y.z` and the PRs are titled accordingly; the CHANGELOG dates are the source of truth for release days.

## Hotfix path

For critical production bugs:

1. Branch `hotfix/name` off **`main`**.
2. Fix, test, open PR against `main` (human approval required — production is never auto-updated, [ADR 0010](../adr/0010-dependency-automation.md)).
3. After merge, tag if needed and **merge the hotfix into `develop` too** — a hotfix that skips `develop` will resurface in the next release.

The Dependabot config fix in v1.4.2 followed exactly this path (`b1b5505`, "hotfix: fix dependabot config and sync package-lock.json").

## What automation does and doesn't do

| Automated | Manual |
| :--- | :--- |
| Weekly grouped dependency PRs → auto-merge on green CI ([ADR 0010](../adr/0010-dependency-automation.md)) | Release branch, changelog, version bumps |
| Security PRs (immediate, individual) | Major dependency updates (labeled `major`, human-reviewed) |
| Image publishing on `main`/tags | PRs against `main` (approval gate) |
| CI on `main` + `develop` | The Go version triangle ([ADR 0011](../adr/0011-go-version-triangle.md)) |

## Release history

The authoritative record is the [CHANGELOG](../../CHANGELOG.md). Notable milestones: 0.1.0 (initial, 2026-04-21) → 0.8.0 (dealer) → 1.6.0 (dealer-free rounds) → 1.7.0 (abstain card) → 1.9.0 (dark theme + room transitions) → 1.9.2 (Docker builder bumped to Go 1.27); the unreleased line adds automated dependency merging and the Go 1.27 alignment (go.mod, CI, Docker).