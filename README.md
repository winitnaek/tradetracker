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
# Dividend tracking

Use **Add Dividend** on the dashboard or the **Dividends** page to record received payments. Payments include a symbol, provider/account, payment date, amount received, cash/reinvested type, optional frequency, and notes. The Dividends page supports editing, deleting, and filtering payments.

Dashboard Total Profit combines realized trading profit (after existing trade fees) and received dividends. Adding, editing, or deleting a dividend recalculates this total. Daily trading goals, trade counts, trading charts, reports, and statistics retain their trading calculations. Recent Trades and Today's Summary retain their dashboard positions; dividend income and recent payments appear below them.

Dividend monthly, quarterly, and annual totals use calendar payment dates. The dashboard date selects the reporting month, quarter, and year; totals cover those entire calendar periods. All-time totals include all recorded payments. Reinvested dividends count once as income and do not automatically create a share purchase. Frequency is descriptive and does not generate recurring payments. Future payments are rejected.

Payments are stored in a separate `dividends` MongoDB collection (override with `DIVIDENDS_COLLECTION`) and scoped to the authenticated user. No migration of existing trades is required.

Validation: run `node --test tests/dividends.test.js` from `server`, and `npm run build` from `client`.
