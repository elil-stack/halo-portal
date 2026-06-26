# Spinframe Portal

A web application for managing and displaying the rollout of **Spinframe Technologies'** solutions across **Qube Holdings'** Australian ports.

- **Gantt view** — a timeline of every solution, colour-coded by rollout status, with a "today" marker.
- **Map view** — an interactive map of Australia with a pin per port, coloured by the port's least-advanced solution, plus a status filter.
- **Two roles** — `Spinframe` (editor) can add/edit solutions; `Qube` (viewer) is read-only.
- **Google Sheets as the database** — all data reads from and writes to a single Google Sheet in real time.

The stack is **React (Vite) + Tailwind CSS** on the front end, **Vercel serverless functions** for the Google Sheets bridge, and **Leaflet** for the map.

---

## Contents

1. [Quick start (demo mode)](#1-quick-start-demo-mode)
2. [Google Sheet setup](#2-google-sheet-setup)
3. [Google Sheets API credentials](#3-google-sheets-api-credentials)
4. [Environment variables](#4-environment-variables)
5. [Local development](#5-local-development)
6. [Deploying to Vercel](#6-deploying-to-vercel)
7. [How it works](#7-how-it-works)

---

## 1. Quick start (demo mode)

You can explore the entire UI without any Google credentials. With no backend
reachable, the app drops into **demo mode** and serves sample data from your
browser's `localStorage`.

```bash
npm install
npm run dev
```

Open the printed URL and log in with:

| Role               | Password    |
| ------------------ | ----------- |
| Spinframe (editor) | `spinframe` |
| Qube (viewer)      | `qube`      |

> Demo passwords apply **only** in demo mode. Once the serverless backend and
> real environment variables are in place, the passwords you set in
> `SPINFRAME_PASSWORD` / `QUBE_PASSWORD` are the only ones that work.

---

## 2. Google Sheet setup

1. Create a new Google Sheet.
2. On the first tab (default name `Sheet1`), put these **exact** column headers
   in row 1, columns A–G:

   | A    | B           | C             | D      | E                         | F     | G            |
   | ---- | ----------- | ------------- | ------ | ------------------------- | ----- | ------------ |
   | Port | Solution ID | Solution Name | Status | Expected Operational Date | Notes | Last Updated |

3. (Optional) Add a few sample rows. Valid values:
   - **Port:** `Brisbane`, `Melbourne`, `Port Kembla`, `Adelaide`, `Darwin`, `Fremantle`
   - **Status:** `Assembly`, `Testing`, `Shipment`, `Placement`, `Validation`, `Operational`
   - **Expected Operational Date:** any date (e.g. `2026-09-15`)

4. Copy the **Sheet ID** from the URL — it's the long string between `/d/` and `/edit`:
   `https://docs.google.com/spreadsheets/d/`**`THIS_IS_THE_ID`**`/edit`

---

## 3. Google Sheets API credentials

The serverless functions use a **service account** so the app can read and write
the sheet without per-user OAuth.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and create
   (or select) a project.
2. **APIs & Services → Library →** search for **Google Sheets API** → **Enable**.
3. **APIs & Services → Credentials → Create Credentials → Service account.**
   Give it a name and create it (no roles required).
4. Open the new service account → **Keys → Add key → Create new key → JSON.**
   A JSON key file downloads. Keep it safe — it's a secret.
5. From that JSON file you need two values:
   - `client_email`  → becomes `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key`   → becomes `GOOGLE_PRIVATE_KEY`
6. **Share the sheet with the service account.** Open your Google Sheet →
   **Share** → paste the service account's `client_email` → give it **Editor**
   access. (Without this step the app can't read or write the sheet.)

---

## 4. Environment variables

Copy `.env.example` to `.env` and fill it in:

```bash
cp .env.example .env
```

| Variable                        | Description                                                              |
| ------------------------------- | ------------------------------------------------------------------------ |
| `SPINFRAME_PASSWORD`            | Password for the editor role.                                            |
| `QUBE_PASSWORD`                 | Password for the read-only viewer role.                                  |
| `GOOGLE_SHEET_ID`               | The sheet ID from its URL.                                               |
| `GOOGLE_SHEET_NAME`             | Tab/worksheet name (defaults to `Sheet1`).                              |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL`  | The `client_email` from the service-account JSON.                       |
| `GOOGLE_PRIVATE_KEY`            | The `private_key` from the JSON, quoted, with literal `\n` line breaks. |

> **About `GOOGLE_PRIVATE_KEY`:** paste it exactly as it appears in the JSON
> (it contains `\n` escape sequences). Keep the surrounding double quotes. The
> serverless code converts the `\n` back into real newlines at runtime.

These are all **server-side only** — none of them are bundled into the browser.

---

## 5. Local development

**Front end only (demo mode):**

```bash
npm run dev
```

**Full stack (real Google Sheets + serverless functions)** — use the Vercel CLI so
the `/api` functions run locally:

```bash
npm i -g vercel
vercel link          # one-time: link this folder to a Vercel project
vercel env pull      # pull env vars into .env.local (or use your .env)
vercel dev
```

`vercel dev` serves the Vite front end and the `/api/*` functions together, so
the app talks to your real sheet.

---

## 6. Deploying to Vercel

1. Push this repository to GitHub/GitLab/Bitbucket.
2. In the [Vercel dashboard](https://vercel.com/) → **Add New → Project** → import
   the repo. Vercel auto-detects the Vite framework; no build settings needed
   (Build command `vite build`, output `dist`).
3. **Project → Settings → Environment Variables:** add every variable from
   [section 4](#4-environment-variables) (for the Production, Preview, and
   Development environments as desired).
   - When pasting `GOOGLE_PRIVATE_KEY`, include the quotes and `\n` sequences
     exactly as in the JSON file.
4. **Deploy.** Vercel builds the front end and deploys the `/api` functions
   automatically.
5. Visit your deployment URL and sign in with the role passwords you set.

To change data without redeploying, just edit the Google Sheet (or use the
in-app editor as the Spinframe role) — the portal reads it live.

---

## 7. How it works

```
Browser (React/Vite + Tailwind + Leaflet)
   │
   ├── POST /api/login   → validates password against env vars, returns role
   │
   └── /api/rows
         ├── GET   → reads all rows from the Google Sheet
         ├── POST  → appends a new solution row   (editor password required)
         └── PUT   → updates a row by Solution ID (editor password required)
                            │
                            ▼
                 Google Sheets API (service account)
                            │
                            ▼
                     Your Google Sheet
```

- **Auth:** passwords live only in environment variables and are checked
  server-side in `/api/login`. The editor's password is sent in an
  `x-portal-password` header on writes and re-validated server-side, so the
  read-only Qube role can never write.
- **Writes are immediate:** every save in the editor panel `POST`/`PUT`s straight
  to the sheet and stamps `Last Updated`.
- **Demo mode:** if the `/api` functions aren't reachable (e.g. plain `vite`
  with no backend), the app falls back to sample data in `localStorage` so the
  UI is always explorable. A "Demo mode" badge appears in the nav bar.

### Project structure

```
api/
  _sheets.js     Google Sheets read/append/update helpers
  login.js       POST /api/login
  rows.js        GET/POST/PUT /api/rows
src/
  api.js         Front-end API client (+ demo-mode fallback)
  constants.js   Ports, statuses, colours, coordinates
  utils.js       Date/format helpers
  App.jsx        Layout, state, routing between views
  components/
    Login.jsx
    Navbar.jsx
    GanttView.jsx
    MapView.jsx
    EditorPanel.jsx
    StatusBadge.jsx
    StatusLegend.jsx
```
