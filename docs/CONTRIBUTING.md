# Contributing to Backlog Royale

First off, thank you for considering contributing to Backlog Royale! It's people like you that make the agile community better.

> This document used to live at the repository root. It is now the single contribution guide; GitHub still recognizes it in this location.

## How Can I Contribute?

### Reporting Bugs

- Check the [Issues](https://github.com/j-stechmann/backlog-royale/issues) to see if the bug has already been reported.
- If not, create a new issue. Provide a clear title, a detailed description, and steps to reproduce the bug.
- Include the version label shown in the bottom-right corner of the frontend, plus browser/OS details for frontend issues or logs for backend issues (the backend logs structured JSON — see [Logging](operations/logging.md)).

### Suggesting Enhancements

- Open a new issue with the tag "enhancement".
- Describe the feature you'd like to see and why it would be useful.
- If your idea touches a documented design decision, read the relevant [ADR](adr/README.md) first and link it — proposals that overturn a decision should reference the decision record.

### Pull Requests

This project follows the **Git Flow** branching model (see [ADR 0012](adr/0012-git-flow.md)).

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix off the `develop` branch: `git checkout -b feature/your-feature-name develop`.
3.  Make your changes.
4.  Ensure your code follows the existing style and passes linting.
    - Frontend: `npm run lint`
    - Backend: `go fmt ./...`
5.  Commit your changes (see [commit conventions](development/standards.md#commit-messages)).
6.  Push to your branch: `git push origin feature/your-feature-name`.
7.  Open a Pull Request against the `develop` branch.

For critical production bug fixes, branch off `main` into a `hotfix/` branch and open a Pull Request against `main` (and integrate the result into `develop` afterwards).

## Development Environment Setup

Please refer to [Getting started](guides/getting-started.md) and [Development setup](development/setup.md) for toolchain versions, commands, and environment variables.

## Development Standards & "Laws"

To ensure the project remains stable and maintainable, all contributors (including AI agents) must adhere to the following. The expanded rationale lives in [Coding standards](development/standards.md).

### 1. Verification is Mandatory

Before submitting any pull request or finalizing changes:

- **Backend**: run `go test -v ./...` and ensure all tests pass.
- **Frontend**: run `npm run test` and `npm run lint`.
- **New features**: must include accompanying unit tests (Go `*_test.go` or Vitest `*.test.ts`). See [Testing strategy](development/testing.md) for the house style.

### 2. Backend (Go) Patterns

- **Logging**: use `log/slog` for structured logging. Never use `fmt.Printf` or standard `log` for application logs.
- **WebSocket messages**: use strictly typed structs for JSON communication. Avoid `map[string]interface{}`.
- **Configuration**: use environment variables via `os.Getenv` in `main.go`.

### 3. Frontend (React) Patterns

- **Testing**: use **Vitest** and **React Testing Library**.
- **State management**: prefer hooks and context over global state libraries unless complexity demands otherwise.
- **API/WS URLs**: never hardcode URLs. Use `import.meta.env` as documented in [Configuration](reference/configuration.md).

### 4. Continuous Integration

The project uses GitHub Actions (see [CI/CD pipelines](operations/ci-cd.md)). Ensure your changes do not break the CI pipeline. All PRs require the `backend`, `frontend`, and `docker` checks to pass.

### 5. Dependency Updates

Dependency updates are automated with **Dependabot** — do not hand-edit lockfiles for routine bumps. The full policy (grouping, auto-merge, the Go version triangle) is documented in [Dependency management](development/dependencies.md).

### 6. Documentation

If you add or change:

- a configuration variable → update [Configuration](reference/configuration.md) and the relevant service README;
- the architecture or a design decision → update the relevant [architecture](architecture/overview.md) page, and write a new [ADR](adr/README.md) if a decision is made or changed;
- user-visible behavior → update [Features](product/features.md) and/or [Game rules](product/game-rules.md);
- anything at all → add a `CHANGELOG.md` entry under `[Unreleased]`.

## License

By contributing to Backlog Royale, you agree that your contributions will be licensed under its [GPLv2 License](../LICENSE).