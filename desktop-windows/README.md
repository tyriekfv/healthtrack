# HealthTrack for Windows (no Docker)

An Electron shell around the exact same server the Docker image runs. It
spawns the Next.js standalone server as a plain Node process (using a
bundled portable `node.exe`, not Electron's own Node), waits for it to come
up, then opens it in a native window — no browser tab, no terminal.

- **Data location:** `%APPDATA%\HealthTrack\` (SQLite database, uploads,
  auth keys — same layout the Docker image keeps under `/data`).
- **Tray icon:** closing the window hides it to the tray instead of quitting;
  the server keeps running. Use the tray menu to reopen, view the log file,
  toggle "Start with Windows", or actually quit.
- **Log file:** `%APPDATA%\HealthTrack\healthtrack.log`.
- **Google Sign-in / Oura sync are hidden.** Both need a stable public HTTPS
  URL for OAuth redirects, which a local desktop app doesn't have. No code
  changes were needed for this — the app already hides each feature until
  its keys (`GOOGLE_CLIENT_ID`, `OURA_CLIENT_ID`) are configured, and this
  build simply never sets them. Email/password login works normally.
- **AI features (Anthropic API key)** aren't configured by default either,
  but you can enable them yourself: drop a `HealthTrack.env` file in the
  `%APPDATA%\HealthTrack\` data folder with a line like
  `ANTHROPIC_API_KEY=sk-ant-...` and restart the app.

## Building the installer

There's no Windows machine in the environment that builds this repo, so the
installer is built on GitHub's `windows-latest` Actions runner — that's also
what guarantees `better-sqlite3`'s native binding is compiled for Windows,
not Linux.

Trigger it manually: **Actions → Windows Desktop Build → Run workflow**. The
finished `.exe` (NSIS installer, per-user install, no admin rights required)
comes back as a downloadable workflow artifact named
`HealthTrack-Windows-Installer`.

**The installer is unsigned** — there's no code-signing certificate in this
project. Windows SmartScreen will show an "unrecognized app" warning on
first run; click "More info" → "Run anyway". This is expected for an
unsigned installer, not a build error.

## How it's assembled

`.github/workflows/windows-desktop.yml` does the real work:

1. `npm run build` at the repo root — produces `.next/standalone` (the same
   output the Dockerfile copies into the container image).
2. Bundles `scripts/db-migrate.ts` into `db-migrate.js` next to it, the same
   way the Dockerfile does.
3. Copies `.next/standalone`, `.next/static`, `public/`, and `drizzle/` into
   `desktop-windows/resources/app-standalone/` — mirroring `/app` inside the
   Docker container exactly.
4. Copies the runner's own `node.exe` into `desktop-windows/resources/` —
   this is the portable Node binary the Electron shell spawns the server
   with.
5. `electron-builder` packages `desktop-windows/` plus those resources into
   an NSIS installer.

`src/main.js` is the entire app: on launch it runs migrations, starts
`server.js`, polls `/api/health` until it's up, then opens a `BrowserWindow`
pointed at `http://127.0.0.1:<port>` (a free port is picked automatically,
starting from 3000).
