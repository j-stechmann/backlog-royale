# Backlog Royale - Backend

This is the Go-based backend for Backlog Royale, handling real-time WebSocket communication.

## Architecture

The backend is built as a WebSocket server that manages rooms and client connections. 

- `main.go`: Entry point and HTTP server setup.
- `hub.go`: Manages active clients and broadcasts messages.
- `room.go`: Handles logic for specific voting rooms.
- `client.go`: Manages individual WebSocket connections.

## API

- **GET `/ws`**: Upgrades connection to WebSocket.

### WebSocket Actions

Clients can send the following JSON actions:
- `VOTE`: `{ "action": "VOTE", "payload": { "vote": "5" } }`
- `REVEAL`: `{ "action": "REVEAL" }`
- `RESET`: `{ "action": "RESET" }`

## Development

1. Ensure Go 1.26+ is installed.
2. Run `go run .` in this directory.
3. The server will start on port `8080`.

## Dependencies

- `github.com/gorilla/websocket`: High-performance WebSocket implementation.
- `github.com/google/uuid`: Secure room and client ID generation.
