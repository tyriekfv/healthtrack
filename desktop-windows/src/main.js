/**
 * HealthTrack desktop shell for Windows.
 *
 * Runs the exact same Next.js standalone server the Docker image runs
 * (bundled into resources/app-standalone by the build workflow), as a plain
 * Node child process using a bundled portable node.exe — not Electron's own
 * Node runtime, so the server's native module (better-sqlite3) never has to
 * be rebuilt against Electron's ABI. Electron just supplies the window and
 * the tray icon around it, mirroring docker/entrypoint.sh: run migrations,
 * then start the server, then point a browser (here, a BrowserWindow) at it.
 *
 * No OAuth env vars (GOOGLE_CLIENT_ID, OURA_CLIENT_ID) are ever set here —
 * the app already hides those features in the UI until their keys are
 * configured (see src/lib/auth/index.ts), so leaving them unset is enough to
 * keep them out of this build without touching app code.
 */
const { app, BrowserWindow, Tray, Menu, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');
const net = require('net');

const isPackaged = app.isPackaged;
const resourcesPath = isPackaged
  ? process.resourcesPath
  : path.join(__dirname, '..', 'resources');

const appStandaloneDir = path.join(resourcesPath, 'app-standalone');
const nodeExePath = path.join(resourcesPath, 'node.exe');
const iconPath = path.join(resourcesPath, 'icon.ico');

const dataDir = app.getPath('userData');
const logPath = path.join(dataDir, 'healthtrack.log');

let mainWindow = null;
let tray = null;
let serverProcess = null;
let isQuitting = false;
let chosenPort = 3000;

function log(line) {
  const stamped = `[${new Date().toISOString()}] ${line}\n`;
  try {
    fs.appendFileSync(logPath, stamped);
  } catch {
    // Logging is best-effort — never let a log write crash the app.
  }
}

function findFreePort(preferred) {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.unref();
    tester.on('error', () => {
      // Preferred port is taken — let the OS pick any free one instead.
      const fallback = net.createServer();
      fallback.unref();
      fallback.listen(0, '127.0.0.1', () => {
        const port = fallback.address().port;
        fallback.close(() => resolve(port));
      });
    });
    tester.listen(preferred, '127.0.0.1', () => {
      tester.close(() => resolve(preferred));
    });
  });
}

function waitForServer(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get({ host: '127.0.0.1', port, path: '/api/health', timeout: 2000 }, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) {
          resolve();
        } else if (Date.now() > deadline) {
          reject(new Error(`Server unhealthy (status ${res.statusCode})`));
        } else {
          setTimeout(attempt, 300);
        }
      });
      req.on('error', () => {
        if (Date.now() > deadline) {
          reject(new Error('Server did not become ready in time'));
        } else {
          setTimeout(attempt, 300);
        }
      });
    };
    attempt();
  });
}

function runChild(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: appStandaloneDir, env });
    child.stdout.on('data', (d) => log(`[migrate] ${d.toString().trim()}`));
    child.stderr.on('data', (d) => log(`[migrate:err] ${d.toString().trim()}`));
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(args[0] ?? command)} exited with code ${code}`));
    });
  });
}

/** Optional user overrides (e.g. ANTHROPIC_API_KEY to enable AI features) —
 * a HealthTrack.env file dropped in the data folder, never created by the
 * app itself. Absent by default, which is what keeps this build minimal. */
function readUserEnvOverrides() {
  const overridePath = path.join(dataDir, 'HealthTrack.env');
  const overrides = {};
  try {
    const contents = fs.readFileSync(overridePath, 'utf8');
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      overrides[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
  } catch {
    // No override file — that's the common case, not an error.
  }
  return overrides;
}

async function startServer() {
  fs.mkdirSync(path.join(dataDir, 'uploads'), { recursive: true });
  fs.mkdirSync(path.join(dataDir, 'keys'), { recursive: true });

  chosenPort = await findFreePort(3000);

  const env = {
    ...process.env,
    ...readUserEnvOverrides(),
    NODE_ENV: 'production',
    DATA_DIR: dataDir,
    PORT: String(chosenPort),
    HOSTNAME: '127.0.0.1',
    APP_URL: `http://127.0.0.1:${chosenPort}`,
    DRIZZLE_MIGRATIONS_DIR: path.join(appStandaloneDir, 'drizzle'),
    NEXT_TELEMETRY_DISABLED: '1',
  };

  log('Applying database migrations');
  await runChild(nodeExePath, [path.join(appStandaloneDir, 'db-migrate.js')], env);

  log(`Starting server on port ${chosenPort}`);
  serverProcess = spawn(nodeExePath, [path.join(appStandaloneDir, 'server.js')], {
    cwd: appStandaloneDir,
    env,
  });
  serverProcess.stdout.on('data', (d) => log(`[server] ${d.toString().trim()}`));
  serverProcess.stderr.on('data', (d) => log(`[server:err] ${d.toString().trim()}`));
  serverProcess.on('exit', (code) => {
    log(`Server process exited unexpectedly with code ${code}`);
    serverProcess = null;
  });

  await waitForServer(chosenPort, 30000);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: 'HealthTrack',
    icon: iconPath,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadURL(`http://127.0.0.1:${chosenPort}`);

  // Close (the X button) minimizes to tray instead of quitting — the server
  // keeps running in the background, same as leaving the container running.
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // Anything that isn't the app's own origin (e.g. an external link inside
  // the app) opens in the system browser instead of navigating the window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function createTray() {
  tray = new Tray(iconPath);
  tray.setToolTip('HealthTrack');

  const rebuildMenu = () => {
    const openAtLogin = app.getLoginItemSettings().openAtLogin;
    tray.setContextMenu(
      Menu.buildFromTemplate([
        {
          label: 'Open HealthTrack',
          click: () => {
            mainWindow.show();
            mainWindow.focus();
          },
        },
        {
          label: 'Start with Windows',
          type: 'checkbox',
          checked: openAtLogin,
          click: (item) => {
            app.setLoginItemSettings({ openAtLogin: item.checked });
          },
        },
        {
          label: 'View Log File',
          click: () => shell.showItemInFolder(logPath),
        },
        { type: 'separator' },
        {
          label: 'Quit HealthTrack',
          click: () => {
            isQuitting = true;
            app.quit();
          },
        },
      ]),
    );
  };

  rebuildMenu();
  tray.on('click', () => {
    mainWindow.show();
    mainWindow.focus();
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    Menu.setApplicationMenu(null);
    try {
      await startServer();
      createWindow();
      createTray();
    } catch (err) {
      log(`Startup failed: ${err.message}`);
      dialog.showErrorBox(
        'HealthTrack failed to start',
        `${err.message}\n\nSee the log for details:\n${logPath}`,
      );
      app.quit();
    }
  });

  app.on('window-all-closed', () => {
    // Windows/Linux convention is to quit here, but this app is only ever
    // hidden (see the close handler above), not destroyed, until the tray's
    // Quit is used — so this only fires during an actual quit in practice.
  });

  app.on('before-quit', () => {
    isQuitting = true;
  });

  app.on('will-quit', () => {
    if (serverProcess) {
      log('Stopping server process');
      serverProcess.kill();
    }
  });
}
