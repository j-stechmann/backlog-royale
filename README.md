# <img src="assets/logo.svg" width="48" height="48" align="center" /> Backlog Royale

A real-time Scrum Poker (Story Pointing) application built for agile teams. Fast, beautiful, and simple.

## 📖 Documentation

All project documentation lives in the [`docs/`](docs/README.md) directory. Start with the [documentation map](docs/README.md#documentation-map).

- [Features](docs/product/features.md) — the full feature catalog.
- [Usage guide](docs/guides/usage.md) — how to run a session (for players & facilitators).
- [Getting started](docs/guides/getting-started.md) — run the app locally.
- [Self-hosting](docs/guides/self-hosting.md) — deploy it for real.
- [Architecture](docs/architecture/overview.md) — how it works, deep dive.
- [Design decisions (ADRs)](docs/adr/README.md) — every significant decision, with trade-offs.
- [Protocol reference](docs/reference/protocol.md) — the WebSocket wire format.
- [Contributing](CONTRIBUTING.md) — how to help improve the project (uses Git Flow).

## Features

- 🚀 **Real-time Collaboration:** Instant updates across all participants using WebSockets.
- 🏢 **Room-based:** Create or join specific rooms for different teams or sprint ceremonies.
- 🃏 **Story Pointing:** Fibonacci-based voting (1, 2, 3, 5, 8, 13, 21) plus the "?" card and the "A" (Abstain) card.
- 👁️ **Vote Reveal:** Hide votes until the team is ready to reveal them.
- 🔄 **Quick Reset:** Start new rounds with a single click.
- 🤝 **Dealer-free Rounds:** When no dealer is present, any non-AFK player can reveal results and start the next round.
- 🔗 **Shareable Links:** Easily invite team members by sharing the URL.
- 📱 **Responsive Design:** Works great on desktop and mobile.
- 🌙 **Dark Theme:** Light/dark/system theme with OS-preference detection and a manual override (persisted). Toggle in the header or on the join screen.
- ⚖️ **Legal Pages:** Imprint and Privacy Policy built into the app, reachable via hash routes (`/#/imprint`, `/#/privacy`) from the footer.

## Tech Stack

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Icons:** Lucide React
- **Notifications:** Sonner

### Backend
- **Language:** Go 1.27
- **Real-time:** Gorilla WebSocket
- **ID Generation:** crypto/rand (server-side, per connection)

## Getting Started

### Prerequisites
- Docker & Docker Compose (Recommended)
- OR Go 1.27+ and Node.js 26+ (for local development)

### Running with Docker

The easiest way to get started is using Docker Compose:

```bash
docker-compose up --build
```

- **Frontend:** [http://localhost:8081](http://localhost:8081)
- **Backend:** [http://localhost:8080](http://localhost:8080)

### Local Development

#### Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Run the server:
   ```bash
   go run .
   ```

#### Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm ci
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## License

GPLv2
