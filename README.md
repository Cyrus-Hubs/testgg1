# ScamOS 98

A fictional comedy call-floor game. One to eight players share a daily quota under Boss Big, a boss who yells at silence. Callers are cartoon characters. The vouchers are rubber ducks, the coin is HONK, and the fines are for parking a dream diagonally.

Nothing in this game is a real-world playbook. There are no real people and no real payment data.

## Run locally

```bash
npm install
npm run dev
```

Open http://127.0.0.1:3000

`npm start` serves the production build. Run `npm run build` first:

```bash
npm install
npm run build
NODE_ENV=production npm start
```

The server listens on `0.0.0.0` and `PORT` (default **3000**). The same port serves the site, `GET /healthz`, and the WebSocket at `/ws`. On HTTPS the browser uses `wss://` automatically.

## Play

- Default language is Thai. The **TH / EN** switch covers the desk, callers, apps, and the boss review.
- **Solo Shift** starts immediately. **Create Room** makes a 6-character code, a join link, and a QR code. **Join Room** uses that code.
- Answer the phone. Trust moves from 0 to 100. Quick cards and free text both work. A mic button uses the browser speech API when it exists. Caller playback is optional in Settings.
- Day 1 apps: duck voucher, HONK chart, invoice syllables. The shop sells AnyViewer, the dream-parking desk, and the scratch ticket.
- Paint, notes, a chaos log, and bouncing virus popups fill the slow parts. Hang up fast if a caller starts handing out toolbars.
- The last 30 seconds turn the floor red. Clear the quota or Boss Big fires the shift.
- On a phone (under 768px) the shift is a top HUD plus a bottom dock: Call, Apps, Shop, Tools, Rank. Wider screens keep draggable windows.

Settings can store an optional OpenAI-compatible API key in this browser. It only rewrites caller flavor. Trust still follows the built-in rules. Leave the key empty to play offline.

## Scripts

- `npm run dev` — Vite plus the game server
- `npm test` — unit tests and a Playwright smoke pass (desktop and a 390×844 phone)
- `npm run build` — typecheck, client bundle, server bundle
- `npm start` — production server

## Deploy

`render.yaml` is a Render web-service blueprint: `npm install && npm run build`, then `npm start`, health check `/healthz`, `NODE_ENV=production`.
