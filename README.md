# PulseQuiz Live

PulseQuiz Live is a Next.js + Socket.IO quiz game built for live sessions with three coordinated experiences:

- Host control room for creating and running a session
- Projector-friendly stage screen for questions, reveals, and leaderboards
- Player mobile screen that only shows the answer buttons

## Features

- Real-time multiplayer rooms over Socket.IO
- Host-created rooms with QR code and join URL
- Two-choice and four-choice questions
- Server-authoritative timing, answer locking, and scoring
- Speed-weighted scoring formula with streak bonus
- Reconnect support using stored player sessions
- Unique nickname handling with collision-safe renaming
- Sample quiz bundled in the repo plus custom JSON quiz loading
- Responsive UI with large touch targets and a projector-first stage view

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Socket.IO
- Custom Node server for unified HTTP + WebSocket hosting

## Project structure

- `server.ts` - boots Next.js and Socket.IO in one Node process
- `src/server/gameStore.ts` - authoritative room lifecycle, timers, scoring, and reconnect logic
- `src/server/socketServer.ts` - Socket.IO events and state broadcasts
- `src/server/snapshots.ts` - tailored room snapshots for host/stage/player views
- `src/app/page.tsx` - landing page, sample quiz loader, and room creation
- `src/app/host/[roomCode]/page.tsx` - host control room
- `src/app/stage/[roomCode]/page.tsx` - shared main screen
- `src/app/join/[roomCode]/page.tsx` - player join and answer UI
- `data/sample-quiz.json` - 10-question sample quiz

## Prerequisites

- Node.js 20+
- npm 10+

## Environment variables

Copy `.env.example` to `.env.local` or `.env` and set:

- `APP_URL` - public base URL used by the server for join and stage links
- `NEXT_PUBLIC_APP_URL` - public base URL used by the browser
- `PORT` - local server port, defaults to `3000`

Example:

```bash
APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
PORT=3000
```

## Install

```bash
npm install
```

## Run in development

```bash
npm run dev
```

Open:

- `http://localhost:3000` for the landing page
- create a room as host
- open the projector screen from the host dashboard or visit `/stage/<roomCode>`
- have players join via `/join/<roomCode>` or the QR code

## One-command local start

If you want one command that builds everything and runs the production-style server locally:

```bash
npm run local
```

This will:

- build the Next.js app into `.next`
- compile the custom Socket.IO server into `dist-server`
- start the app at `http://localhost:3000` unless `PORT` is set

## Production build

```bash
npm run build
npm run start
```

This runs the built Next.js app and Socket.IO server together in one Node process.

If you want the non-`tsx` production path directly, use:

```bash
npm run build:all
node dist-server/server.js
```

## Quiz JSON format

Use the bundled sample quiz as a template. Format:

```json
{
  "title": "My Live Quiz",
  "questions": [
    {
      "prompt": "Which planet is known as the Red Planet?",
      "choices": [{ "label": "Mars" }, { "label": "Venus" }],
      "correctIndex": 0,
      "durationMs": 15000
    }
  ]
}
```

Rules:

- each question must have exactly 2 or 4 choices
- `correctIndex` must point to a valid choice
- `durationMs` is optional and defaults to 15000
- `imageUrl` is optional if you want to extend the stage view later

## Scoring

Correct answers use this formula:

```text
score = max(0, round(BASE * (1 - (t / T))^ALPHA))
```

Defaults used in the app:

- `BASE = 1000`
- `ALPHA = 1.7`
- `+50` streak bonus after consecutive correct answers

Where:

- `t` is the player's answer time in milliseconds from question start
- `T` is the question duration in milliseconds

## Host workflow for a meetup

1. Open the home page and create a room with the sample quiz or paste a custom JSON quiz.
2. On the host dashboard, share the QR code or join link.
3. Open the stage screen on the projector or TV.
4. Wait for players to join, then click `Start game`.
5. During each round, watch live response counts from the host dashboard.
6. Click `Reveal answer` to show the correct option and leaderboard.
7. Click `Next question` to continue, or `End game` to finish early.

## Deployment suggestions

### Simplest production deployment

Deploy as a single Node service on:

- Railway
- Render
- Fly.io
- any Docker-capable VM or container platform

Set:

- `APP_URL=https://your-domain.com`
- `NEXT_PUBLIC_APP_URL=https://your-domain.com`
- `PORT` from the platform if required

This is the best fit for the current custom-server setup because HTTP and WebSocket traffic stay together.

### Vercel option

If you specifically want Vercel for the Next.js frontend, keep the UI on Vercel and move the Socket.IO server to a separate Node service. Then point the client socket connection at that WebSocket host. That split is not implemented in this MVP, but the separation in `src/server` is designed to make it straightforward.

## Manual test checklist

1. Create a room and confirm the host is redirected to `/host/<roomCode>`.
2. Open `/stage/<roomCode>` in a second tab and confirm lobby state matches the host screen.
3. Join with two or more players from separate tabs or devices.
4. Try a duplicate nickname and verify the app renames it cleanly.
5. Start the game and confirm players only see answer buttons.
6. Submit one answer twice from the same player and verify only the first answer is accepted.
7. Let a question expire without manual reveal and confirm the server auto-reveals.
8. Check that faster correct answers rank above slower correct answers.
9. Refresh a player tab mid-game and confirm the same nickname/session is restored.
10. End the game and confirm the final leaderboard is shown.

## Automated tests

No automated tests are included yet. The scoring and room engine are structured to be easy to unit test later, especially:

- `src/lib/game/scoring.ts`
- `src/server/gameStore.ts`
- `src/server/snapshots.ts`

## Scaling beyond MVP

For this MVP, room state lives in memory inside one Node process.

To scale to multiple instances:

- move rooms, players, and answers into Redis or Postgres
- use Redis pub/sub or Socket.IO adapters for cross-instance fan-out
- store reconnect tokens and host tokens in shared storage
- move question timers to a durable job queue or centralized worker
- optionally add persistent quiz management and analytics tables