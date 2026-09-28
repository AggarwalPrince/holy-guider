# Holy Guider (https://holyguider.com)

Cross-religion spiritual guidance app: describe a problem, get scripture (original script +
Hindi + English translation) and practical contemplation steps, drawn from the tradition you
select. Free to use: visitors sign in with Google, and each account has a daily consultation allowance.

## Structure
```
holy-guider/
├── backend/     Express API (MongoDB, Google sign-in, Gemini/AICredits AI)
└── frontend/    React + Vite app
```

## Local development

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env
# edit .env — see backend/.env.example for what each variable does and where
# to get keys. At minimum for local dev you need AICREDITS_API_KEY (or
# GEMINI_API_KEY) and a GOOGLE_CLIENT_ID for sign-in.
npm run dev
```
Runs on `http://localhost:5000`. Without `MONGODB_URI` set, it falls back to an
in-memory MongoDB for local development only (data resets on restart) — this
never happens in production (see Security below).

### 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env   # optional — only needed for Google sign-in locally
npm run dev
```
Runs on `http://localhost:5173` and proxies `/api/*` calls to the backend automatically.

Open the frontend URL — you'll land on the welcome screen, pick a tradition,
and you'll be asked to sign in with Google. There is no payment step; each
account gets `DAILY_ASK_LIMIT` free consultations per rolling 24 hours.

### 3. Run the test suite
```bash
cd backend
npm test
```
Runs three suites against an in-memory mock of MongoDB (no real
network calls, no real database needed): `test/smoke.js` (core behaviour —
free asks, daily limit, auth, admin, journal, headers, CSRF), `test/limits.js`
(rate limiting and abuse caps), `test/prod-gate.js` (production-mode safety:
guest/passcode login stay off, weak config is refused at startup, etc).

## Deploying

This app deploys as **one service**: the Express backend also serves the
built React frontend, so you only need one host, one URL, and no CORS setup.

### Option A — Render (recommended, has a free tier)
1. Push this project to a GitHub repo.
2. On [render.com](https://render.com) → **New +** → **Web Service** → connect your repo.
3. Settings:
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Node version:** 18+ (set via `.node-version` or the engines field, already included)
4. Add environment variables (Settings → Environment) — see `backend/.env.example`
   for the full list and what each one does. At minimum, production needs:
   `JWT_SECRET`, `MONGODB_URI`,
   `GOOGLE_CLIENT_ID`, and one of `GEMINI_API_KEY`/`AICREDITS_API_KEY`. The
   server refuses to start in production without these (see Security below).
   `NODE_ENV=production` and `PORT` are set by Render automatically.
5. Deploy. Render gives you a public URL like `https://your-app.onrender.com` — that's your whole app, frontend and API together.

### Option B — Railway
Same idea: **New Project → Deploy from GitHub**, build command `npm run build`,
start command `npm start`, same environment variables as above.

### Option C — Any Node host (VPS, etc.)
```bash
git clone <your-repo>
cd holy-guider
npm run build      # builds the frontend, installs backend deps
# create backend/.env with your production values (see backend/.env.example)
NODE_ENV=production npm start
```

You do **not** need to deploy `frontend/` separately or set `VITE_API_URL` —
the backend serves the built frontend from the same origin. `VITE_API_URL`
(frontend) and `CLIENT_URL` (backend) are only needed if you deploy the
frontend and backend on two different hosts.

### MongoDB
Any MongoDB works — a free-tier [MongoDB Atlas](https://www.mongodb.com/atlas)
cluster is the easiest option. Production refuses to start without `MONGODB_URI`.

## AI provider
`backend/services/spiritualAI.js` tries **Gemini** first (`GEMINI_API_KEY`),
falling back to **AICredits** (`AICREDITS_API_KEY`, `AICREDITS_BASE_URL`,
`AICREDITS_MODEL`) if Gemini isn't configured or fails. Only one of the two
needs to be set. Whatever the model returns is passed through
`sanitizeGuidance()` before it's stored or shown to anyone — see Security below.

## Security
This app handles personal reflections, so a few things are worth
knowing if you're extending it:

- **Sessions are an HttpOnly cookie**, not a token in `localStorage` — page
  JavaScript (and therefore an XSS bug) can never read it. The token itself
  carries no privileges (no "isAdmin" claim); admin status is re-read from
  the database on every request, so revoking an admin (`npm run
  revoke-admin -- someone@example.com`) takes effect on their very next
  request, not after their token eventually expires.
- **CSRF protection**: state-changing requests are checked against an
  Origin/Referer allowlist (`CLIENT_URL`).
- **Google sign-in is required to use the AI.** Guest sessions (off by default
  in production) are refused by `/api/ask`, and each account is capped at
  `DAILY_ASK_LIMIT` consultations per rolling 24 hours (admins exempt).
- **Rate limits everywhere it matters**: admin-passcode brute force (5
  failed attempts / 15 min), guest account creation (per-IP and a global
  daily cap), and per-account AI request throughput — independent of the
  per-IP limiter, and correctly attributed behind a reverse proxy
  (`TRUST_PROXY`).
- **Production refuses to boot with unsafe configuration**: a missing/short
  `JWT_SECRET`, a missing `MONGODB_URI`/Google credential, or a weak `ADMIN_SECRET_KEY` while
  `ADMIN_PASSCODE_LOGIN=true` all stop the process at startup with a message
  naming what's wrong, instead of failing silently or half-working later.
- **AI output is whitelisted** (`sanitizeGuidance()`) before it's stored or
  returned — the model's JSON can never inject unexpected fields (e.g. one
  shadowing `success` in the API response) or oversized content.

Run `npm test` in `backend/` any time you change auth or the ask flow — the suite
exercises sessions, CSRF, admin revocation and the daily limit.

## Notes
- API keys live only on the backend — never exposed to the browser.
- Religion selection is remembered in localStorage for 24 hours, then you're
  asked again.
- Journal entries are saved both to the browser's localStorage (for the
  on-device journal UI) and to MongoDB (`backend/routes/journal.js`), so an
  admin can audit them and a future "sync across devices" feature has data
  to work from.
- There's no curated verse dataset — every result comes straight from the
  AI, so treat outputs as a starting point, not a citation-grade source (the
  app already disclaims this in the UI).
