# <img src="assets/logo.svg" width="48" height="48" align="center" /> Backlog Royale

A real-time Scrum Poker (Story Pointing) application built for agile teams. Fast, beautiful, and simple.

![Backlog Royale UI](https://github.com/user-attachments/assets/7c5c0c1b-4f9b-4e1a-8c1a-7c5c0c1b4f9b) *Replace with actual screenshot if available*

## Features

- 🚀 **Real-time Collaboration:** Instant updates across all participants using WebSockets.
- 🏢 **Room-based:** Create or join specific rooms for different teams or sprint ceremonies.
- 🃏 **Story Pointing:** Fibonacci-based voting (1, 2, 3, 5, 8, 13, 21) plus the "?" card.
- 👁️ **Vote Reveal:** Hide votes until the team is ready to reveal them.
- 🔄 **Quick Reset:** Start new rounds with a single click.
- 🔗 **Shareable Links:** Easily invite team members by sharing the URL.
- 📱 **Responsive Design:** Works great on desktop and mobile.

## Tech Stack

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Icons:** Lucide React
- **Notifications:** Sonner

### Backend
- **Language:** Go 1.26
- **Real-time:** Gorilla WebSocket
- **ID Generation:** Google UUID

## Getting Started

### Prerequisites
- Docker & Docker Compose (Recommended)
- OR Go 1.26+ and Node.js 20+ (for local development)

### Running with Docker

The easiest way to get started is using Docker Compose:

```bash
docker-compose up --build
```

- **Frontend:** [http://localhost](http://localhost)
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
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## License

GPLv2
