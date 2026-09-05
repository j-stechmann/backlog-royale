# 0001. In-memory state, no persistence

**Status:** Accepted
**Date:** 2026-04-21 (original decision); documented 2026-09-05

## Context

Story pointing sessions are short — minutes, not days. The team debated whether room state (participants, votes, reveal flags) should live in a database or in the server process itself. A persistence layer would mean choosing a store (SQLite/Postgres/Redis), modeling a schema, handling migrations, and adding infrastructure to every deployment path (Docker Compose, CI, self-hosting docs).

## Decision

All room state lives in the Go process's memory. There is no database, no external cache, and no serialization of room state anywhere in the codebase. If the server restarts, every room and vote is lost.

## Alternatives

- **SQLite embedded:** survives restarts without infrastructure, but adds cgo/toolchain complexity to the Docker build and a state machine for stale-room GC that nobody asked for.
- **Postgres/Redis:** robust and enables multi-instance later, but forces every self-hoster to run a second service from day one.
- **Snapshot to disk:** cheap middle ground, but introduces partial-write and versioning questions for a state that is worthless minutes after creation.

## Consequences

- **Good:** zero-infrastructure deployments (`docker-compose up` with one service per tier), trivially testable state transitions, no schema to migrate, no cache-invalidation bugs.
- **Bad / accepted:** deploys and crashes wipe active sessions; no audit trail; horizontal scaling blocked (see [Limitations](../architecture/limitations.md)).
- The empty-room teardown (`Room.Run` exiting when `clients` is empty) doubles as the "garbage collection" story — nothing can leak because nothing can outlive its participants.

## References

- `backend/room.go`, `backend/hub.go`
- [Architecture: Concurrency model](../architecture/concurrency.md), [Limitations](../architecture/limitations.md)
- Future-work note in [Configuration](../reference/configuration.md)