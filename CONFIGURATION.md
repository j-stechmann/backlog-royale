# Configuration Plan

This document outlines the configuration strategy for Backlog Royale.

## Backend (Go)

The backend is configured using environment variables.

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | The port the server listens on. | `8080` |
| `ALLOWED_ORIGIN` | Allowed CORS origin. Use `*` for development or a specific domain for production. | `*` |

### Future Enhancements
- Support for `.env` files using `github.com/joho/godotenv`.
- Advanced logging levels via `LOG_LEVEL` (debug, info, warn, error).
- Persistence layer configuration (e.g., Redis/Postgres URL).

## Frontend (React/Vite)

The frontend uses Vite's built-in environment variable support.

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_WS_URL` | The full WebSocket URL of the backend. | `ws://localhost:8080` (or `wss://...` if HTTPS) |

### Development
Create a `.env.local` file in the `frontend` directory:
```env
VITE_WS_URL=ws://localhost:8080
```

### Production
Set the environment variables in your CI/CD or hosting provider (e.g., Vercel, Netlify).

### Theme Preference

The frontend supports light, dark, and system (follows OS `prefers-color-scheme`) themes. The user's choice is persisted in `localStorage` under the key `backlog_royale_theme` (`'light'` | `'dark'` | `'system'`), defaulting to `'system'`. Invalid stored values fall back to `'system'`.

A small inline `<script>` in `frontend/index.html` applies the correct theme class before React mounts to prevent a flash of the wrong theme on reload. If you deploy with a strict Content-Security-Policy header, allow inline scripts (or add a nonce) so this pre-paint script can run.

## Security Best Practices
1. **Never commit `.env` files.** They are included in `.gitignore`.
2. **Restrict CORS.** In production, `ALLOWED_ORIGIN` must be set to the frontend's domain.
3. **Use WSS.** Always use `wss://` in production for encrypted WebSocket communication.
