# ApolloAI

This repository contains a front-end demo for ApolloAI (dashboard, study planner, login, settings) and a minimal Node/Express backend that provides a simple AI planning heuristic for scheduling assignments.

Quick dev notes:

- Start the demo server (serves static files and planner API):

  1. Install dependencies:

	  npm install

  2. Start the server:

	  npm start

  The app will be available at http://localhost:3000/. The frontend will attempt to call `/api/suggest` when adding an assignment to get AI scheduling suggestions.

- The backend is intentionally minimal and uses a heuristic planner (in `ai/planner.js`). Replace or extend that module to connect to a proper ML/LLM service if desired. See `server.js` for the API endpoints.
Note about deploying to Vercel

This project can be deployed to Vercel. There are two recommended, practical approaches:

1) Deploy the frontend to Vercel and use the included serverless endpoints (preferred for Vercel):
  - The `api/` folder contains serverless functions (`/api/suggest`, `/api/assignments`, `/api/register`, `/api/login`) that run on Vercel.
  - These endpoints are stateless and return planner suggestions using `ai/planner.js`. They are suitable for running on Vercel's serverless platform.
  - Important: the included serverless functions are intentionally stateless and do not persist users or assignments. For production you should connect them to a persistent store (examples below).

2) Deploy a full Node server (server.js) to a Node-capable host and point the frontend (on Vercel) to that API:
  - This keeps local file-based persistence (`data/assignments.json`) but requires a host that supports long-running Node processes (Render, DigitalOcean App Platform, Railway, etc.).

Persistence options (recommended for production on Vercel):
 - Upstash (Redis) or Vercel KV: serverless-friendly key-value stores. Use the store's SDK or REST API inside your serverless functions to persist assignments and users.
 - Supabase or Fauna: Postgres-like or document DB, simple to integrate and persistent across invocations.

Deployment steps for Vercel (serverless endpoints):
 1. Install the Vercel CLI (optional for local dev):

   npm i -g vercel

 2. From the project root, run (interactive deploy):

   vercel

 3. Set any production environment variables (if you add a DB):
   - If you integrate Upstash, set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in the Vercel project settings and modify the serverless functions to use those.
   - For Vercel KV, follow Vercel's docs to provision KV and use `@vercel/kv` in your functions.

Notes & limitations
 - The serverless endpoints included are stateless: they run the planner and return suggestions, but do not persist assignments or user accounts. This keeps them simple to run on Vercel immediately.
 - To enable persistence you must add a DB or key-value store and update the handler(s) in `api/*.js` to read/write there. I can implement Upstash or Supabase wiring for you if you want — tell me which provider.


Files added by this change:

- `server.js` - minimal Express static server + endpoints
- `ai/planner.js` - heuristic scheduling engine (returns suggested time slots)
- `package.json` - to run the server easily

Notes on next steps:

- Add role-based auth and secure APIs (JWT, session store, or integration with your identity provider).
- Replace heuristic planner with a model-backed planner (OpenAI, local LLM, or other service) for better quality suggestions.
- Add calendar conflict checks and richer availability model for users.

## Security & Environment Variables

Important: never commit secrets (API keys, tokens, JWT secrets) to source control or public chat. If you accidentally exposed a key (for example by pasting it into a public chat), rotate it immediately.

This project reads these environment variables (see `.env.example`):

- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis REST credentials for persistence (optional).
- `JWT_SECRET` — a long random secret used to sign JWTs. Generate using a secure random function (e.g. `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).
- `AI_API_URL` and `AI_API_KEY` — the LLM endpoint and API key (optional). For OpenAI use `https://api.openai.com/v1/chat/completions` for `AI_API_URL` and your OpenAI API key for `AI_API_KEY`.

If you accidentally leaked a key (for example by pasting it into a chat):

1. Revoke/delete the leaked key in the provider console (OpenAI → API keys). Create a new key.
2. Update the new key in Vercel (Project → Settings → Environment Variables) and any local environments where you run the app.
3. If the leaked key was used in any automation or CI, rotate it there as well.

To add variables to Vercel: Project → Settings → Environment Variables → Add each variable (name/value). Mark them as sensitive and choose the environment scopes (Preview/Production). Redeploy after changes.

Local development: prefer setting env vars in your shell session (PowerShell example):

```powershell
$env:AI_API_KEY = 'paste-your-key-here'
$env:AI_API_URL = 'https://api.openai.com/v1/chat/completions'
$env:JWT_SECRET = 'your-generated-secret'
npm start
```

Do not commit `.env.local` or files containing secrets — `.gitignore` in this repo already excludes `.env*` and `data/*.json`.

### Seeding an admin user into Upstash (one-time)

If you provisioned Upstash and set `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and `JWT_SECRET` in your environment, you can run the included one-time seeder to create an admin user and receive an admin JWT:

PowerShell example:

```powershell
$env:UPSTASH_REDIS_REST_URL='https://...'
$env:UPSTASH_REDIS_REST_TOKEN='...'
$env:JWT_SECRET='your-jwt-secret'
node scripts/seed-admin-upstash.js --email admin@apollo.local --password 'choose-a-strong-password' --first Site --last Admin
```

The script will store the user into Upstash (`apolloai:users`) and print a safe user object and an admin JWT. Save the JWT securely and use it as the `apolloai-token` in the browser (or paste into `localStorage.apolloai-token`) to access admin-only endpoints like `GET /api/users`.

## Vercel environment variables (recommended)

When deploying the serverless `api/` handlers you should set the following environment variables in your Vercel project settings:

- `UPSTASH_REDIS_REST_URL` — your Upstash REST URL (e.g. https://<id>.upstash.io)
- `UPSTASH_REDIS_REST_TOKEN` — the Upstash REST token
- `JWT_SECRET` — a long random secret for signing JWTs (generate securely)
- Optional LLM keys:
  - `AI_API_URL` — e.g. https://api.openai.com/v1/chat/completions
  - `AI_API_KEY` — your LLM provider API key

After adding environment variables in Vercel, trigger a new deployment so they are available to serverless functions.

### Quick curl checks (example)

Use a JWT (from register/login or the seeder script) to call protected endpoints. Example (replace <URL> and <JWT>):

```bash
curl -H "Authorization: Bearer <JWT>" <URL>/api/settings

curl -X POST -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
  -d '{"theme":"dark","study-duration":30}' <URL>/api/settings

curl -X POST -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
  -d '{"firstName":"Alice","lastName":"Smith"}' <URL>/api/update-profile
```

If your deployment uses Upstash/Redis for persistence and a valid `JWT_SECRET`, these endpoints will persist and return the updated objects.

## Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/r3xicodes/ApolloAI.git
   cd ApolloAI
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local server (on port 5500):
   ```bash
   $env:PORT=5500  # PowerShell
   # Or: export PORT=5500  # Bash
   node server.js
   ```

4. Open http://localhost:5500 in your browser.

5. For local testing with authentication:
   - Open browser dev tools → Console
   - Set: `localStorage.setItem('apolloai-token', '1')`
   - This enables testing protected endpoints with demo user id 1

### Setting up CI smoke tests (GitHub Actions)

The repository includes a GitHub Actions workflow to run smoke tests against preview deployments. To set this up:

1. Go to your repository's Settings → Secrets and variables → Actions
2. Add these repository secrets:
   - `PREVIEW_BASE_URL`: Your Vercel preview URL (e.g., https://apolloai-preview.vercel.app)
   - `SMOKE_TEST_TOKEN`: A test JWT token for validating authenticated endpoints

The workflow runs automatically on pull requests. You can also trigger it manually:
1. Go to Actions → "Smoke test preview deployment"
2. Click "Run workflow"
3. Optionally provide a different preview URL to test
4. Click "Run workflow" to start the test

The smoke test will validate:
- GET /api/settings returns settings
- POST /api/settings saves settings
- POST /api/update-profile updates profile fields

### Setting up GitHub repository secrets

The smoke-test workflow requires two secrets. To set them up:

1. Go to your repository's Settings → Secrets and variables → Actions → "New repository secret"

2. Add `PREVIEW_BASE_URL`:
   - For Vercel: Use the preview URL from a pull request (e.g. https://apolloai-preview.vercel.app)
   - For local testing: Use http://localhost:5500

3. Add `SMOKE_TEST_TOKEN`:
   - Local development: Use '1' (the demo admin user ID)
   - Production: Use a real JWT token from the seeder script
   ```bash
   # Generate a test token using the seeder:
   $env:JWT_SECRET="your-secret-here"
   node scripts/seed-admin-upstash.js --email test@apollo.local --password 'test123' --first Test --last User
   # Copy the JWT from the output
   ```

4. In GitHub's Actions tab:
   - Click "Smoke test preview deployment"
   - Click "Run workflow"
   - For local testing: Enter http://localhost:5500 in the "Optional preview URL" field


