# TradeTracker

**Track your trades. Measure your progress.**

TradeTracker is a responsive personal trading journal for manually recording stock trades and tracking realized profit against a configurable daily goal. It does not connect to brokerages, execute trades, or track investment capital.

## Requirements

- Node.js 18 or newer
- A MongoDB Atlas database (or local MongoDB URI)
- Optional Google Identity Services client ID

## Windows setup

From PowerShell:

```powershell
Copy-Item .env.example .env
notepad .env
cd server
npm install
npm run dev
```

In a second PowerShell window:

```powershell
cd client
npm install
npm start
```

Open http://localhost:3000. The Webpack development server proxies `/api` requests to http://localhost:5000, so cookies work without CORS workarounds.

## Configuration

Set `MONGODB_URI` and a long random `SESSION_SECRET` in `.env`. Set `GOOGLE_CLIENT_ID` to enable Google sign-in. Set `HIDE_GOOGLE_AUTH=true` to hide the Google option; its default is `false`. Local email/password registration works without Google configuration.

The server stores sessions in MongoDB and uses secure, `HttpOnly`, same-site cookies. In production, deploy behind HTTPS and set `NODE_ENV=production`.

## Commands

- Client development: `cd client; npm start`
- Client production build: `cd client; npm run build`
- Server development: `cd server; npm run dev`
- Server production: `cd server; npm start`

## Core API

Authentication: `/api/auth/register`, `/login`, `/google`, `/logout`, `/me`. Authenticated resources: `/api/trades`, `/api/trades/:id/close`, `/api/goals`, `/api/dashboard`, and `/api/providers`.

All resource ownership is derived from the authenticated session. The API never accepts a frontend-provided user ID for authorization.
