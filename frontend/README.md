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

## 🛠️ Tech Stack

- **React 19**: Modern component-based UI.
- **Vite**: Ultra-fast build tool and dev server.
- **Tailwind CSS 4**: Utility-first styling.
- **TypeScript**: Type-safe development.
- **Lucide React**: Icon library.
- **Sonner**: Toast notifications.

## 📁 Project Structure

- `src/components`: UI components (Card, Logo, etc.)
- `src/hooks`: Custom hooks, notably `useBacklogRoyale` for WebSocket logic.
- `src/App.tsx`: Main application container and layout.
- `src/main.tsx`: Entry point.

## 🔧 Environment Variables

By default, the application connects to the backend at `localhost:8080`. For production deployments, ensure the WebSocket connection logic in `src/hooks/useBacklogRoyale.ts` matches your environment.
