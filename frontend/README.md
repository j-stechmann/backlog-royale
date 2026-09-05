# Backlog Royale - Frontend

A modern, responsive React frontend for real-time Scrum Poker. Built with Vite, TypeScript, and Tailwind CSS 4.

## ✨ Features

- **Real-time Sync**: Uses WebSockets for zero-latency updates.
- **Responsive UI**: Optimized for both mobile and desktop.
- **Fibonacci Scoring**: Standard agile pointing system.
- **Dynamic Routing**: Join any room via a simple URL.
- **Version Indicator**: Displays the current app version in the bottom-right corner.
- **Legal Pages**: Imprint and Privacy Policy via hash routes (`/#/imprint`, `/#/privacy`; no router dependency), linked from the footer next to the version.
- **Dark Theme**: Light, dark, and system (follows OS) modes with a persisted manual override. Toggle via the segmented control in the header (joined view) or the top-right of the join card.

Deep dives: [architecture](../docs/architecture/frontend.md) · [theming](../docs/adr/0009-semantic-tokens-and-dark-theme.md) · [legal pages](../docs/adr/0013-hash-based-legal-pages.md) · [docs map](../docs/README.md).

## 🚀 Getting Started

### Prerequisites
- Node.js 26 or higher

### Installation
1. Install dependencies:
   ```bash
   npm ci
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

- `src/components`: UI components (Card, Logo, ThemeToggle, etc.)
- `src/hooks`: Custom hooks, notably `useBacklogRoyale` for WebSocket logic and `useTheme` for theme switching.
- `src/utils/theme.ts`: Vote-band color mapping (emerald/blue/rose by point value) with light/dark variants.
- `src/index.css`: Tailwind v4 setup, semantic color tokens (`:root`/`.dark` + `@theme inline`), and the `bounce-subtle` animation.
- `src/test`: Testing setup and utilities.
- `src/App.tsx`: Main application container and layout.
- `src/main.tsx`: Entry point.

## 🔧 Environment Variables

The application uses Vite environment variables.

| Variable | Description |
| :--- | :--- |
| `VITE_WS_URL` | Override the default WebSocket URL (e.g., `wss://api.example.com`) |
