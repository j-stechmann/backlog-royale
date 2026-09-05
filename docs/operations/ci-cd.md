# CI/CD Pipelines

The workflows that guard and publish the project. The automation decisions behind them are in [ADR 0010](../adr/0010-dependency-automation.md) and [ADR 0012](../adr/0012-git-flow.md); this page is the operational reference.

## Workflow inventory

| File | Name | Triggers | Purpose |
| :--- | :--- | :--- | :--- |
| `.github/workflows/ci.yml` | CI | push/PR → `main`, `develop` | Build, test, lint, and Docker-build both images |
| `.github/workflows/dependabot-auto-merge.yml` | Dependabot auto-merge | `pull_request_target` | Auto-merge green dependency PRs; label majors |
| `.github/workflows/docker-publish.yml` | Build and Push Docker Images | push → `main`; tags `v*.*.*` | Publish both images to GHCR |

## CI: the three gates

All three run on `ubuntu-latest` for every push and PR touching `main` or `develop` (develop coverage added in v1.6.1 so dependency PRs are gated the same as features).

### `backend`

- `actions/setup-go@v7` with `go-version: '1.27.x'` and cache keyed on `backend/go.sum`.
- `go build -v ./...`, then `go test -v ./...`.

### `frontend`

- `actions/setup-node@v7`, Node 26, npm cache keyed on `frontend/package-lock.json`.
- `npm ci` → `npm run lint` → `npm run test` → `npm run build`.

### `docker`

- `docker/setup-buildx-action@v4`, then `docker/build-push-action@v7` for both contexts (`./backend`, `./frontend`) with `push: false`.
- Exists so **base-image bumps are validated before they can merge** (see [ADR 0010](../adr/0010-dependency-automation.md)) — a broken Dockerfile cannot auto-merge.

Branch protection requires all three jobs on every PR; PRs against `main` additionally require human approval.

## Dependabot auto-merge

Runs on `pull_request_target` (elevated token — Dependabot PRs get read-only tokens under `pull_request`; the workflow only reads metadata and calls the API, never checking out PR code).

```text
pull_request_target ──► guards ──► fetch-metadata@v3 ──┬─ minor/patch ─► gh pr merge --auto --merge
                                                       └─ major ──────► gh pr edit --add-label "major"
```

Guards: `github.repository == 'j-stechmann/backlog-royale'` ∧ author `dependabot[bot]` ∧ `base.ref == 'develop'`. Permissions: `contents: write`, `pull-requests: write`.

## Docker publishing

On every push to `main` and every `v*.*.*` tag:

- Login to `ghcr.io` with `GITHUB_TOKEN` (`docker/login-action@v4.6.0`).
- Metadata via `docker/metadata-action@v6`, images `ghcr.io/j-stechmann/backlog-royale/backend` and `…/frontend`, tags: branch ref, PR ref, tag ref, `{{version}}`, `{{major}}.{{minor}}`, `{{major}}`, and `type=sha`.
- Build & push both images (`docker/build-push-action@v7`).

The `packages: write` permission is granted per-job; the rest of the workflow runs read-only.

## Version notes

- Actions are themselves Dependabot-managed (the `github-actions` ecosystem) and pinned to major tags (`@v7`, `@v4`) — except `docker/login-action@v4.6.0` and `metadata-action@v6`, which are patch-pinned from earlier history. Mixed pinning styles are cosmetic; the weekly group PRs keep everything current.
- `docker-publish.yml` grants `permissions: packages: write` and defaults the rest to read-only, following least-privilege.

## Extending the pipelines

- **New CI gate:** add a job to `ci.yml` *and* make it required in branch protection before relying on it in the auto-merge path — an optional check does not gate merges.
- **New publish trigger:** `docker-publish.yml` fires on `main` and tags only; releases are tag-driven ([Release process](../development/release-process.md)).
- **Never add code-checkout to the auto-merge workflow** — its `pull_request_target` safety argument depends on executing nothing from the PR ([ADR 0010](../adr/0010-dependency-automation.md)).