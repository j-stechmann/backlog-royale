# Backlog Royale - Frontend

This is the React-based frontend for Backlog Royale, built with Vite and Tailwind CSS.

## Features

- **Dynamic Room Support:** Connect to different rooms via URL parameters.
- **Real-time State Sync:** Reactive UI that updates as team members vote.
- **Mobile-First Design:** Fully responsive interface using Tailwind CSS 4.
- **Fibonacci Cards:** Intuitive selection for story points.

## Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run lint`: Runs ESLint for code quality.
- `npm run preview`: Previews the production build locally.

## Environment Variables

The application connects to the backend via WebSockets. By default, it attempts to connect to the same host on port 8080 (or as configured in `src/hooks/useBacklogRoyale.ts`).

## Dependencies

- **React 19:** Latest features and performance.
- **Tailwind CSS 4:** Modern CSS-in-JS alternative for styling.
- **Lucide React:** Beautiful, consistent iconography.
- **Sonner:** Toast notifications for actions like "Link Copied".
