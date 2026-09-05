# 0011. The Go version triangle

**Status:** Accepted
**Date:** 2026-08-30; documented 2026-09-05

## Context

Three places state the Go toolchain version: the `go` directive in `backend/go.mod`, `go-version` in `.github/workflows/ci.yml`, and the builder image in `backend/Dockerfile`. Dependabot had been bumping the `go` directive independently — including **patch** bumps triggered by a dependency's own `go.mod` requirement. Because Go's `GOTOOLCHAIN=auto` silently downloads a newer toolchain whenever one is demanded, such an auto-merged bump would make CI build with a toolchain the Dockerfile never pinned: builds could behave differently between environments with no visible change in the repository. The fix (PR #98, with review iterations on which bump types to ignore) aligned all three at Go 1.27.0 and locked the directive.

## Decision

1. The three places are bumped **together, by hand**, as one change — the "Go version triangle": `backend/go.mod` + `ci.yml` + `backend/Dockerfile`.
2. Dependabot is configured to ignore **all** version updates (major, minor, *and* patch) of the `go` directive. Patch-level bumps are included in the ignore because a dependency's own `go` directive requirement can force them, and they would auto-merge invisibly.
3. The pinned builder image (`golang:1.27.0-alpine3.23`) is the enforcement mechanism: it fixes the compiler version at build time regardless of any toolchain-download shenanigans.
4. The backend README and root README prerequisites state the matching version so humans can't drift either.

## Alternatives

- **Let `go` float, pin only CI/Docker:** the drift problem in reverse — `go.mod` requirements from dependencies would still demand newer toolchains via `GOTOOLCHAIN=auto`.
- **Ignore only major/minor:** the first attempt; review showed patch bumps could still auto-merge and trigger toolchain downloads, so patch was added to the ignore list (commit `16123a6`).
- **Set `GOTOOLCHAIN=local` in builds:** defense-in-depth worth considering, but pinning the Docker builder already prevents the silent-download path in the environment that matters most.

## Consequences

- **Good:** CI, Docker, and `go.mod` can no longer disagree silently; toolchain changes are deliberate, reviewed, and visible in all three places at once.
- **Bad / accepted:** Go patch releases (which sometimes contain security fixes) must be picked up manually — the Dependabot ignore is deliberately blunt; a contributor bumping only one corner of the triangle gets a CI failure rather than a silent drift, which is the intended failure mode.

## References

- `.github/dependabot.yml` (the `ignore` block with its rationale comment), `backend/go.mod`, `.github/workflows/ci.yml`, `backend/Dockerfile`
- Commits: `16e0cf6`, `5d5b087`, `16123a6` (PR #98); CHANGELOG `[Unreleased]`
- [Dependency management](../development/dependencies.md), [CI/CD](../operations/ci-cd.md)