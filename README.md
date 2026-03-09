# LOOPED 🎮

> Play. Scroll. Repeat.

TikTok-style infinite vertical feed of instantly playable micro-games — embedded in sandboxed iframes. Built for mobile web, PWA-ready.

## Quick Start

```bash
npm install
cp .env.example .env      # Edit DATABASE_URL and ADMIN_TOKEN
npx prisma db push
npx tsx prisma/seed.ts    # Seeds 8 games
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

### Option 1: CLI
```bash
npm i -g vercel
vercel --prod
```

Set environment variables in Vercel dashboard:
- `DATABASE_URL` — use Vercel Postgres or Turso for production
- `ADMIN_TOKEN` — any secret string for admin access

### Option 2: GitHub Integration
1. Push this repo to GitHub
2. Import at [vercel.com/new](https://vercel.com/new)
3. Set env vars
4. Deploy

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | SQLite: `file:./prod.db` or Turso/Postgres URL |
| `ADMIN_TOKEN` | Secret token for /admin and /insights |
| `NEXT_PUBLIC_APP_URL` | Your deployed URL |

## Architecture

### Core UX
- **Swipe up** → next game (200–280ms slide transition)
- **Swipe down** → previous game
- **3-card window stack** — prev/current/next mounted, others paused
- Host owns gesture — never let iframe steal swipe

### postMessage Protocol (v1)
```
Envelope: { lo: "looped", v: 1, type, session_id, game_id, payload }

Host → Game: LOOPED_INIT | LOOPED_PAUSE | LOOPED_RESUME | LOOPED_DESTROY
Game → Host: GAME_READY | GAME_START | GAME_END | GAME_ERROR
```

GAME_END payload must include `duration_ms`. If game doesn't respond within 200ms of DESTROY, host synthesizes `GAME_END { completed: false, rage_quit: true }`.

### Pages
| Route | Description |
|---|---|
| `/` | Main feed |
| `/admin` | Game management (password protected) |
| `/insights` | Analytics dashboard (password protected) |
| `/tools` | Tools lane (Blueprint Analyzer placeholder) |
| `/create` | Creative lane (3D Staging placeholder) |

### API
| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/feed/sessions` | POST | Create feed session, get initial cards |
| `/api/v1/feed/sessions/{id}/next` | POST | Get next batch of cards |
| `/api/v1/events/batch` | POST | Ingest up to 200 telemetry events |
| `/api/v1/games` | GET | List games |
| `/api/v1/games/{id}` | GET | Get single game |
| `/api/v1/auth/anonymous` | POST | Mint anonymous user token |
| `/api/v1/me/favorites` | POST | Add favorite |
| `/api/v1/me/favorites/{id}` | DELETE | Remove favorite |
| `/api/admin/games` | GET/POST | Admin game CRUD |
| `/api/admin/games/{id}` | PATCH/DELETE | Update/archive game |
| `/api/admin/builds` | POST | Create game build |
| `/api/insights` | GET | Analytics per game |

## Game Lanes
- `main` — Default feed (SlitherCow, Word Puzzle, Shooter, Cow Crush)
- `learn` — Learn lane (Language Learning, Study Quiz)
- `tools` — Tools tab (Blueprint Analyzer)
- `creative` — Creative lane (3D Staging)

## Brand

| Token | Value |
|---|---|
| Background | `#0B0B0B` |
| Primary text | `#FFFFFF` |
| Secondary text | `#9CA3AF` |
| Accent | `#7B61FF` |
| Disabled | `#4B5563` |
| Error | `#EF4444` |
| Font | Inter (400/500/700) |

## Tech Stack
- **Next.js 15** (App Router)
- **Prisma** + SQLite (swap to Turso/Postgres for prod)
- **Tailwind CSS**
- **TypeScript**

## Adding a Real Game
1. Deploy your game as a standalone web app
2. In `/admin`, add a GameBuild with your `url` and `allowedOrigin`
3. Implement the postMessage protocol in your game:
```js
// Listen for LOOPED_INIT
window.addEventListener('message', (e) => {
  if (e.data?.lo === 'looped' && e.data.type === 'LOOPED_INIT') {
    // Start your game!
    window.parent.postMessage({ lo: 'looped', v: 1, type: 'GAME_READY', 
      session_id: e.data.session_id, game_id: e.data.game_id }, '*');
  }
});

// When game ends
window.parent.postMessage({ lo: 'looped', v: 1, type: 'GAME_END',
  session_id, game_id, payload: { score: 1234, duration_ms: 45000, completed: true } 
}, '*');
```
