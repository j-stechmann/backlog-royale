# Backlog Royale - Frontend

A modern, responsive React frontend for real-time Scrum Poker. Built with Vite, TypeScript, and Tailwind CSS 4.

## ✨ Features

- **Real-time Sync**: Uses WebSockets for zero-latency updates.
- **Responsive UI**: Optimized for both mobile and desktop.
- **Fibonacci Scoring**: Standard agile pointing system.
- **Dynamic Routing**: Join any room via a simple URL.

## 🚀 Getting Started

### Prerequisites
- Node.js 20 or higher

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

### Running Tests
```bash
npm run test
```

## 🛠️ Tech Stack

- **React 19**: Modern component-based UI.
- **Vite**: Ultra-fast build tool and dev server.
- **Vitest**: Blazing fast unit test runner.
- **Tailwind CSS 4**: Utility-first styling.
- **TypeScript**: Type-safe development.
- **Lucide React**: Icon library.
- **Sonner**: Toast notifications.

## 📁 Project Structure

- `src/components`: UI components (Card, Logo, etc.)
- `src/hooks`: Custom hooks, notably `useBacklogRoyale` for WebSocket logic.
- `src/test`: Testing setup and utilities.
- `src/App.tsx`: Main application container and layout.
- `src/main.tsx`: Entry point.

## 🔧 Environment Variables

The application uses Vite environment variables.

| Variable | Description |
| :--- | :--- |
| `VITE_WS_URL` | Override the default WebSocket URL (e.g., `wss://api.example.com`) |
