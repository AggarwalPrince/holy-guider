# Holy Guider (https://holyguider.com)

Cross-religion spiritual guidance app: describe a problem, get scripture (original script +
Hindi + English translation) and practical contemplation steps, drawn from the tradition you
select.

## Structure
```
spiritual-helper/
├── backend/     Express API (calls Gemini -> AICredits -> AICredits)
└── frontend/    React + Vite app
```

## Local development

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env
# edit .env and paste your API key(s) - see backend/.env.example for where to get free keys
npm run dev
```
Runs on `http://localhost:5000`.

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173` and proxies `/api/*` calls to the backend automatically.

Open the frontend URL — you'll land on the welcome screen, pick a tradition,
and you're in.

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
4. Add environment variables (Settings → Environment) — same names as in `backend/.env.example`:
   - `AICREDITS_API_KEY`
   - `OPENROUTER_API_KEY`
   - `GROQ_API_KEY_1` through `GROQ_API_KEY_5` (up to 5 free AICredits keys — see below)
   - (`PORT` — leave unset, Render sets this automatically)
5. Deploy. Render gives you a public URL like `https://your-app.onrender.com` — that's your whole app, frontend and API together.

### Option B — Railway
Same idea: **New Project → Deploy from GitHub**, build command `npm run build`, start command `npm start`, add the same three env vars.

### Option C — Any Node host (VPS, etc.)
```bash
git clone <your-repo>
cd spiritual-helper
npm run build      # builds the frontend, installs backend deps
# create backend/.env with your API keys (see backend/.env.example)
npm start           # serves everything on process.env.PORT || 5000
```

You do **not** need to deploy `frontend/` separately or set `VITE_API_BASE` —
the backend serves the built frontend from the same origin. `VITE_API_BASE` is
only there for the rare case you want frontend and backend on two different
hosts; if so, set it to your backend's URL before running `npm run build` in
`frontend/`.

## AICredits: multiple keys + auto model updates
AICredits's free tier is generous but rate-limited per key/model, so this app can
use up to **5 AICredits API keys at once**:
- Set `GROQ_API_KEY_1` .. `GROQ_API_KEY_5` (any subset is fine — leave the
  rest blank if you only have 2 or 3).
- Requests are spread round-robin across whichever keys are configured. If
  one key gets rate-limited (HTTP 429), it's put on a short cooldown and the
  next key is used instead — the request doesn't fail just because one key
  is temporarily maxed out.
- The **model is never hardcoded**. Every ~10 minutes (and instantly if a
  model call fails because it's been retired), the backend asks AICredits's own
  `/models` endpoint which models are currently live and picks the best
  available free-tier chat model automatically. If AICredits renames, retires, or
  swaps out its free model, the app just follows along on the next request —
  no code change or redeploy needed.

## Notes
- API keys live only on the backend — never exposed to the browser.
- Religion selection is remembered in localStorage for 24 hours, then you're
  asked again.
- Journal entries save to localStorage only (no database yet) — swap in
  MongoDB later by replacing `frontend/src/utils/storage.js` calls with API
  requests to a new `backend/routes/journal.js` if you want entries synced
  across devices.
- Currently there's no curated verse dataset — every result comes straight
  from the AI, so treat outputs as a starting point, not a citation-grade
  source (the app already disclaims this in the UI).

