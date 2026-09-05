# Backlog Royale Documentation

Welcome to the Backlog Royale documentation. This directory is the single home for all project documentation: product information, architecture, decision records, references, guides, development processes, and operational runbooks.

Backlog Royale is a real-time Scrum Poker (story pointing) application: a Go backend hosts WebSocket rooms, a React frontend renders the voting experience, and all state is synchronized server-authoritatively. See the [architecture overview](architecture/overview.md) for the big picture.

## Documentation Map

The documentation is organized by audience. Pick the section that matches what you are trying to do:

| Audience | Start here | Contains |
| :--- | :--- | :--- |
| **Players / facilitators** | [Usage guide](guides/usage.md) | How to join, vote, reveal, deal, go AFK |
| **New contributors** | [Getting started](guides/getting-started.md) | Running the app locally, first build |
| **Operators / self-hosters** | [Self-hosting](guides/self-hosting.md) | Docker, reverse proxies, TLS, upgrades |
| **Backend / frontend engineers** | [Architecture overview](architecture/overview.md) | How the system works and why |
| **Reviewers / decision makers** | [ADR index](adr/README.md) | Every significant design decision, with context |
| **Release managers** | [Release process](development/release-process.md) | Git Flow, versioning, publishing |

## Full Index

### Product

- [Features](product/features.md) — the full feature catalog, with where each is implemented.
- [Game rules](product/game-rules.md) — roles, permissions, round lifecycle, card semantics.
- [FAQ](product/faq.md) — answers to the questions users actually ask.

### Architecture

- [Overview](architecture/overview.md) — system context, design goals, data flow.
- [Backend](architecture/backend.md) — Hub, Room, Client, identity, deduplication.
- [Frontend](architecture/frontend.md) — components, hooks, connection lifecycle, theming.
- [Concurrency model](architecture/concurrency.md) — goroutine ownership, channels, backpressure.
- [Security](architecture/security.md) — rate limiting, vote secrecy, origin checks, known gaps.
- [Limitations](architecture/limitations.md) — what this design deliberately does not do.

### Architecture Decision Records

- [ADR index and process](adr/README.md)
- [0001 — In-memory state, no persistence](adr/0001-in-memory-state.md)
- [0002 — Full-state broadcast synchronization](adr/0002-full-state-broadcasts.md)
- [0003 — Server-authoritative identity](adr/0003-server-authoritative-identity.md)
- [0004 — JSON over WebSocket protocol](adr/0004-json-websocket-protocol.md)
- [0005 — Server-side vote secrecy](adr/0005-server-side-vote-secrecy.md)
- [0006 — Dealer role and the no-dealer fallback](adr/0006-dealer-role-and-no-dealer-fallback.md)
- [0007 — Distribution-only vote summary](adr/0007-distribution-only-vote-summary.md)
- [0008 — Room eviction via per-room channel](adr/0008-eviction-via-room-channel.md)
- [0009 — Semantic color tokens and dark theme](adr/0009-semantic-tokens-and-dark-theme.md)
- [0010 — Automated dependency management](adr/0010-dependency-automation.md)
- [0011 — The Go version triangle](adr/0011-go-version-triangle.md)
- [0012 — Git Flow branching model](adr/0012-git-flow.md)
- [0013 — Hash-based legal pages](adr/0013-hash-based-legal-pages.md)

### Reference

- [WebSocket protocol](reference/protocol.md) — endpoint, actions, message schemas, sequencing.
- [Configuration](reference/configuration.md) — environment variables, localStorage keys, CSP notes.

### Guides

- [Getting started](guides/getting-started.md) — prerequisites, Docker quickstart, local development.
- [Usage](guides/usage.md) — the end-to-end user walkthrough.
- [Self-hosting](guides/self-hosting.md) — images, reverse proxy, TLS, upgrades.

### Development

- [Development setup](development/setup.md) — toolchain versions, commands, pitfalls.
- [Testing strategy](development/testing.md) — what is tested, how, and why it is written that way.
- [Coding standards](development/standards.md) — the project's "laws" for Go, React, commits, docs.
- [Release process](development/release-process.md) — versioning and the release checklist.
- [Dependency management](development/dependencies.md) — Dependabot grouping, auto-merge policy.

### Operations

- [CI/CD pipelines](operations/ci-cd.md) — workflows, jobs, publishing, branch protection.
- [Logging](operations/logging.md) — structured log events and how to consume them.
- [Troubleshooting](operations/troubleshooting.md) — symptom → cause → fix.

## Conventions

- **Links are relative** so the tree works on GitHub, in editors, and in offline clones.
- **`CHANGELOG.md` stays at the repository root** (convention and tooling). Every documentation change must add an entry there under `[Unreleased]` — see [CONTRIBUTING](CONTRIBUTING.md).
- **ADRs are immutable once accepted.** To change a decision, write a new ADR that supersedes the old one and link both ways. See the [ADR process](adr/README.md).
- **Service READMEs** (`backend/README.md`, `frontend/README.md`) stay short: quickstart plus pointers into this tree. Deep explanations belong here, not there.
- **`AGENTS.md`** (repository root) holds the automation rules for AI agents working on this repo.

## Where are the quickstart commands?

In the root [README](../README.md#getting-started), deliberately kept short. The long form is in [Getting started](guides/getting-started.md).