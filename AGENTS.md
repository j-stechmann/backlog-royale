# AI Agent Guidelines

This document provides specific instructions for AI agents working on the Backlog Royale codebase.

## Workflow: Git Flow

This project strictly adheres to the **Git Flow** branching model. All agents must follow this workflow:

1.  **Production Branch**: `main` stores the official release history.
2.  **Development Branch**: `develop` serves as an integration branch for features.
3.  **Feature Branches**: Use `feature/name` for new features or non-critical fixes. Always branch off `develop`.
4.  **Release Branches**: Use `release/x.x.x` when preparing for a new release. Branch off `develop` and merge into both `main` and `develop`.
5.  **Hotfix Branches**: Use `hotfix/name` for critical production bug fixes. Branch off `main` and merge into both `main` and `develop`.

### Pull Requests
- Pull requests for features should be targeted at the `develop` branch.
- Pull requests for hotfixes should be targeted at the `main` branch (and subsequently integrated into `develop`).

## Documentation Updates

For every addition, change, or deletion, agents **must** update:

1.  **READMEs**: Update the root `README.md` and any relevant service-specific READMEs (e.g., `backend/README.md`, `frontend/README.md`) to reflect the current state and usage. Service READMEs stay short: quickstart plus pointers into `docs/`.
2.  **Changelog**: Add a corresponding entry to `CHANGELOG.md` (repository root) under the `[Unreleased]` section.
3.  **Documentation (`docs/`)**: The full documentation tree lives in `docs/` — see the [documentation map](docs/README.md). Update what is relevant:
    - Configuration change → `docs/reference/configuration.md` (+ service README).
    - Architecture/behavior → the relevant `docs/architecture/` page.
    - New or changed design decision → new ADR in `docs/adr/` (ADRs are immutable once accepted; supersede, don't edit).
    - User-visible behavior → `docs/product/features.md` and/or `docs/product/game-rules.md`.
    - Operations/CI → `docs/operations/`.

    Legacy root files (`ARCHITECTURE.md`, `CONFIGURATION.md`) are redirects into `docs/` — do not grow them; put content in `docs/`.
4.  **Cross-links**: When adding docs pages, add them to the index in `docs/README.md`.

## Quality Standards
- Ensure all tests pass before finalizing any task.
- Follow the patterns and conventions established in the existing codebase.
- Maintain clear and concise commit messages.
