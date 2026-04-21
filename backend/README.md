# Backlog Royale - Backend

The Go-based backend for Backlog Royale. It manages WebSocket connections, rooms, and real-time state broadcasting.

## 🏗️ Architecture

The server uses a Hub-and-Spoke model:
- **Hub**: Manages all active rooms.
- **Room**: A goroutine-backed session for a specific group of users.
- **Client**: A WebSocket connection wrapper.

For a more detailed overview, see the [Architecture documentation](../ARCHITECTURE.md).

## 🚀 Getting Started

### Prerequisites
- Go 1.26 or higher

### Running Locally
1. Install dependencies:
   ```bash
   go mod download
   ```
2. Run the server:
   ```bash
   go run .
   ```
The server will be available at `http://localhost:8080`.

### Running Tests
```bash
go test -v ./...
```

## ⚙️ Configuration

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `8080` | Server port |
| `ALLOWED_ORIGIN` | `*` | CORS restricted origin |

The WebSocket endpoint is `/ws`.

### Connection Parameters
- `room`: (Required) The unique ID of the room to join.
- `name`: (Required) The name of the user joining.

Example: `ws://localhost:8080/ws?room=my-room&name=Alice`

### Actions (Client -> Server)

Messages should be sent as JSON.

| Action | Payload | Description |
| :--- | :--- | :--- |
| `VOTE` | `{ "vote": "string" }` | Casts a vote. |
| `REVEAL` | `none` | Reveals all votes in the room. |
| `RESET` | `none` | Resets the room for a new round. |

### Events (Server -> Client)

| Event | Description |
| :--- | :--- |
| `STATE` | The current state of the room, sent after every change. |

## 🛠️ Project Structure

- `main.go`: Server initialization and route handling.
- `hub.go`: Room management logic.
- `room.go`: Core game logic and broadcasting.
- `client.go`: WebSocket reader/writer loops.
