# Troubleshooting

Symptom → cause → fix, in the order operators usually hit them. Log event semantics are in [Logging](logging.md); the underlying mechanisms are in the [architecture docs](../architecture/overview.md).

## Connection problems

### "Reconnecting..." never resolves to "Live"

1. **Wrong WebSocket URL.** The client derives `wss/ws://` + host; on non-localhost that assumes a reverse proxy routes `/ws` to the backend. Check: browser devtools → Network → the `/ws` request. 404/502 → proxy misroute; see [Self-hosting](../guides/self-hosting.md).
2. **Proxy strips Upgrade headers.** Handshake fails with 4xx/5xx from the proxy. Add the `Upgrade`/`Connection` headers to the `/ws` location.
3. **Proxy idle timeout too short.** Connects, then dies within a minute or two. Raise read/send timeouts beyond the 60 s pong window.
4. **`ALLOWED_ORIGIN` too strict.** Backend logs `upgrade error`; the browser sees the upgrade fail. Set the exact frontend origin or `*` for testing.
5. **Per-IP rate limiting.** HTTP 429s in the proxy logs / backend log. Many users behind one NAT or a proxy without real-IP forwarding share a 10-burst bucket — preserve client IPs ([Configuration](../reference/configuration.md#security-best-practices-for-deployment)).

### A player disconnects and their vote disappears

Expected. The vote is kept until the server notices the dead socket (pong deadline, up to ~60 s), then the row is removed with the vote. On reconnect the player is a new identity — just vote again. If this happens *without* a real disconnect, see "Ghost players" below.

### A player from an old room still appears (ghost)

The `prevId` eviction should have removed them. Causes:

1. The client did not send `prevId` (it only sends it on an actual room switch — same-room reconnects deliberately do not). Wait up to a pong deadline; the stale socket cleans itself up.
2. The `evict` channel was full — backend logs `evict channel full, dropping eviction`; the ghost clears when the stale socket dies. If ghosts persist indefinitely, check that the old connection is actually dead (network state, client crash loops).

### Two tabs of the same room evict each other

The v1.9.0 fix makes tabs that reach a room via its URL (auto-join) or a reconnect coexist without sending `prevId`. One path is still subject to eviction: a second tab that opens the plain URL and **submits the join form** forwards the shared localStorage ID as `prevId`, evicting the first tab's connection (which then reconnects fresh). If you see mutual eviction *without* a form-join involved, the `prevIdToEvict` lifecycle in `useGameState.ts` broke — it should be set from the pre-switch ID and cleared on `WELCOME` ([ADR 0008](../adr/0008-eviction-via-room-channel.md), including the documented form-join sharp edge).

## Game behavior

### Someone revealed before everyone voted

If done via the UI, check the button gate (`PlayerList` disables Reveal until all players have voted) and who has the dealer seat. If it happened with devtools/automation: the server checks role, not completeness — a known, accepted gap ([Game rules → Known gaps](../product/game-rules.md#known-gaps-between-ui-and-server-enforcement)).

### A vote changed after the reveal

Same class of gap: the server's `handleVote` is phase-agnostic. UI-only guard. See the same Known gaps section.

### Votes visible before reveal?

They shouldn't be — secrecy is server-side ([ADR 0005](../adr/0005-server-side-vote-secrecy.md)). If you observe real vote values in WebSocket frames with `reveal: false`, that is a security bug: file it with the exact frame contents.

### My vote didn't register

1. **Rate limiting:** check for `Rate limit exceeded` in the backend log.
2. **Channel overflow:** `broadcast channel full, dropping message` — the vote was dropped under load; retry.
3. **Invalid value:** only `1 2 3 5 8 13 21 ? A` are accepted; anything else is ignored.
4. **You are the dealer or AFK:** neither role votes; the UI hides the grid but a scripted client would hit the same rule.

### The room vanished

Rooms are destroyed when the last participant leaves, and **everything is lost on backend restart** — no persistence ([ADR 0001](../adr/0001-in-memory-state.md)). If the backend restarted mid-ceremony (deploy, OOM), that is the explanation; check `docker logs` for `ListenAndServe failed` or container restarts.

## UI and theme

### Flash of the wrong theme on load

The pre-paint inline script in `index.html` is being blocked — typically by a strict CSP header. Allow inline scripts or add a nonce ([Configuration](../reference/configuration.md#content-security-policy-note)).

### Theme toggle missing / toasts stay light

`useTheme` runs in `App.tsx`; `<Toaster>` receives the theme prop. A mismatch usually means a stale bundle — hard-refresh. The favicon deliberately never themes ([ADR 0009](../adr/0009-semantic-tokens-and-dark-theme.md)).

### Version footer shows the wrong number

`__APP_VERSION__` is injected at build time from `package.json`; a stale image build shows a stale version. Rebuild/redeploy ([Release process](../development/release-process.md)).

## Deployment

### Backend exits immediately

`ListenAndServe failed` in the logs → port already bound or permission denied. Check `PORT` and that nothing else holds the port (the container listens on 8080; Compose maps backend 8080→8080 and frontend 8080→**8081** on the host — mixing these up binds two services to one host port).

### Container permission errors after a base-image bump

Both images run non-root (backend `appuser`, frontend nginx-unprivileged uid 101). A volume mount or a custom nginx config owned by root will fail; chown accordingly or use named volumes.

### Docker build fails in CI after a base-image bump

The `docker` gate exists to catch this before merge. If it failed: the bumped tag is probably wrong/nonexistent (e.g. alpine point release not yet published) — pin the version that exists; check the builder/runtime tag pairing ([Self-hosting](../guides/self-hosting.md#images)).

## Still stuck?

Open a GitHub issue with: the version footer value, what you expected vs. what happened, relevant backend log lines (JSON), and browser console output for frontend issues. Reproduction steps beat descriptions. See [CONTRIBUTING](../CONTRIBUTING.md#reporting-bugs).