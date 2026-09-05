# Logging

The backend logs structured JSON to stdout via `log/slog` (`slog.NewJSONHandler`), installed as the default logger at startup in `main.go`. There is no log file, no level knob (yet — see [Configuration](../reference/configuration.md)); everything goes to stdout and is container-runtime's business from there.

## Event catalog

### Lifecycle

| Event | Level | Fields | Meaning |
| :--- | :--- | :--- | :--- |
| `Server starting` | Info | `port` | Boot confirmation |
| `Room started` | Info | `id` | A room's event-loop goroutine began |
| `Room closing` | Info | `id` | Last client left; room self-destructed |
| `Creating new room` | Info | `id` | Hub created a room on first join |
| `Removing room` | Info | `id` | Hub deleted the (now empty) room |

### Degraded paths (warnings — the interesting ones)

| Event | Level | Fields | Meaning |
| :--- | :--- | :--- | :--- |
| `unregister channel full, dropping disconnect` | Warn | `client`, `id` | Mass disconnect exceeding the 64-slot buffer; no read-pump cleanup follows (the socket is already dead), so the ghost lingers until its outbound send buffer fills or the room self-destructs |
| `broadcast channel full, dropping message` | Warn | `client`, `id` | Client action dropped — a VOTE was lost; the client should retry |
| `evict channel full, dropping eviction` | Warn | `client`, `room` | Room switch ghost not evicted now; cleaned up later by the stale socket's read pump |
| `room register channel full, closing connection` | Warn | `room` | New connection closed at the door rather than queued |
| `Rate limit exceeded` | Warn | `client`, `id` | WS message rate limiter tripped (10 msg/s); excess dropped |
| `failed to unmarshal action` | Warn | `error` | Malformed JSON from a client |

### Errors

| Event | Level | Fields | Meaning |
| :--- | :--- | :--- | :--- |
| `read error` | Error | `error` | Socket read failed with an *unexpected* close code (going-away/abnormal are filtered out as normal disconnects) |
| `failed to marshal state` | Error | `error` | Serialization failed — state not broadcast (should be impossible; a bug if seen) |
| `upgrade error` | Error | `error` | WebSocket handshake failed |
| `ListenAndServe failed` | Error | `error` | Fatal: port binding or accept failure; process exits 1 |

### Debug

| Event | Level | Fields | Meaning |
| :--- | :--- | :--- | :--- |
| `Handling action` | Debug | `room`, `type`, `user`, `id` | Every processed action (default handler level is Info, so hidden unless the level is lowered) |

## Notes on the design

- **Warning parity is deliberate.** Every non-blocking send that can drop work logs a warning. Before v1.9.0 some drops were silent, which is how ghost clients went undiagnosed ([ADR 0008](../adr/0008-eviction-via-room-channel.md)). If you add a `select … default` drop path, add a `slog.Warn` — it is a reviewed convention ([Coding standards](../development/standards.md#backend-go)).
- **Unexpected-close filtering:** `readPump` treats `CloseGoingAway` and abnormal closure as normal disconnects and does not log them as errors — otherwise every tab close would be an alert.
- **No per-message Info spam:** client actions log at Debug only; at the default level, a quiet log means a healthy server.

## Consuming the logs

Everything is JSON on stdout, so any log stack works as-is:

```bash
docker logs -f backlog-backend | jq 'select(.level=="WARN")'
```

Useful queries: `Room closing` frequency (churn), the four "full, dropping" warnings (overload or abuse), `Rate limit exceeded` (rowdy clients), `failed to unmarshal action` (protocol bugs).

## Frontend observability

The frontend has no logging pipeline by design. Observable state: the header pill (`Live` / `Reconnecting...`) and toast notifications for role changes. Client-side connection drops are visible only from the server's perspective (the client's `read error`/unregister path on the backend).

## Known gaps

- No `LOG_LEVEL` environment variable yet (tracked in [Configuration](../reference/configuration.md) as future work); all Debug events are compiled in but filtered at the default level.
- No request-level HTTP access logging (the only HTTP route is the WebSocket upgrade).
- No correlation IDs across a client's lifetime beyond the 16-char connection ID.