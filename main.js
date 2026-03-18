const { app, BrowserWindow, ipcMain, session, webContents, shell } = require('electron');
const path = require('path');
const fs   = require('fs');

/* ── Constants ────────────────────────────────────────────────────────────── */
const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const PRELOAD   = path.join(__dirname, 'preload-spoof.js');

const SERVICES = [
  { id: 'gemini',   partition: 'persist:gemini'   },
  { id: 'chatgpt',  partition: 'persist:chatgpt'  },
  { id: 'claude',   partition: 'persist:claude'   },
  { id: 'kimi',     partition: 'persist:kimi'     },
  { id: 'deepseek', partition: 'persist:deepseek' },
  { id: 'qwen',     partition: 'persist:qwen'     },
  { id: 'mistral',  partition: 'persist:mistral'  },
  { id: 'grok',     partition: 'persist:grok'     },
  { id: 'z',        partition: 'persist:z'        },
  { id: 'copilot',  partition: 'persist:copilot'  },
  { id: 'perplexity', partition: 'persist:perplexity' },
  { id: 'meta',     partition: 'persist:meta'    },
  { id: 'luzia',    partition: 'persist:luzia'   },
];

/* ── Single instance ─────────────────────────────────────────────────────── */
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

/* ── Clean stale LevelDB LOCK files ─────────────────────────────────────── */
function cleanLockFiles() {
  const base = app.getPath('userData');
  SERVICES.forEach(({ id }) => {
    const idbDir = path.join(base, 'Partitions', id, 'IndexedDB');
    if (!fs.existsSync(idbDir)) return;
    let entries;
    try { entries = fs.readdirSync(idbDir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (!e.isDirectory() || !e.name.endsWith('.leveldb')) continue;
      const lock = path.join(idbDir, e.name, 'LOCK');
      if (fs.existsSync(lock)) {
        try   { fs.unlinkSync(lock); console.log(`[cleanup] Removed stale LOCK: ${lock}`); }
        catch (err) { console.warn(`[cleanup] Skip LOCK (${lock}): ${err.message}`); }
      }
    }
  });
}

/* ── Patch a session ─────────────────────────────────────────────────────── */
function patchSession(ses) {
  ses.setUserAgent(CHROME_UA);

  ses.webRequest.onHeadersReceived({ urls: ['*://*/*'] }, (details, cb) => {
    const h = { ...details.responseHeaders };
    for (const key of Object.keys(h)) {
      const l = key.toLowerCase();
      if (l === 'x-frame-options' ||
          l === 'content-security-policy' ||
          l === 'content-security-policy-report-only' ||
          l === 'x-content-security-policy') delete h[key];
    }
    cb({ responseHeaders: h });
  });

  ses.webRequest.onBeforeSendHeaders({ urls: ['*://*/*'] }, (details, cb) => {
    cb({ requestHeaders: { ...details.requestHeaders, 'User-Agent': CHROME_UA } });
  });
}

/* ── Decide how to handle a new-window from a webview ───────────────────── */
// Google OAuth CANNOT work inside Electron WebView regardless of spoofing —
// Google detects the embedded browser at the network/TLS level.
// Solution: open Google auth in the OS default browser; when the user is done
// they come back to the app and click the ↺ reload button to pick up cookies.
// Non-Google popups (like OpenAI's own auth) open in a BrowserWindow popup.
function isGoogleAuth(url) {
  return url.includes('accounts.google.com');
}
function isOtherAuth(url) {
  return url.includes('auth.openai.com') ||
         url.includes('openai.com/auth') ||
         url.includes('appleid.apple.com') ||
         url.includes('microsoft.com/devicelogin') ||
         url.includes('login.microsoftonline.com');
}

function openAuthPopup(url, parentWin, partition) {
  patchSession(session.fromPartition(partition));
  const popup = new BrowserWindow({
    width: 520, height: 720,
    parent: parentWin, modal: false,
    backgroundColor: '#ffffff',
    title: 'Iniciar sesión',
    webPreferences: {
      partition,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: PRELOAD,
    },
  });
  popup.webContents.setUserAgent(CHROME_UA);
  popup.loadURL(url);
  popup.webContents.setWindowOpenHandler(({ url: u }) => { popup.loadURL(u); return { action: 'deny' }; });
  popup.on('closed', () => {
    if (!parentWin.isDestroyed()) parentWin.webContents.send('auth-popup-closed', partition);
  });
  return popup;
}

/* ── Wire a webview's webContents ────────────────────────────────────────── */
function wireWebview(wvContents, win, partition) {
  wvContents.setUserAgent(CHROME_UA);

  const handleURL = (url, preventDefault) => {
    if (!url || url === 'about:blank') return;
    if (isGoogleAuth(url)) {
      if (preventDefault) preventDefault();
      // Open in system browser — only reliable way with Google
      shell.openExternal(url);
      // Tell renderer to show "reload after login" hint
      win.webContents.send('google-auth-opened', partition);
      return;
    }
    if (isOtherAuth(url)) {
      if (preventDefault) preventDefault();
      openAuthPopup(url, win, partition);
    }
  };

  wvContents.setWindowOpenHandler(({ url }) => {
    handleURL(url, null);
    return { action: 'deny' };
  });

  wvContents.on('will-navigate', (e, url) => handleURL(url, () => e.preventDefault()));
  wvContents.on('will-redirect', (e, url) => handleURL(url, () => e.preventDefault()));
}

/* ── Create main window ──────────────────────────────────────────────────── */
function createWindow() {
  patchSession(session.defaultSession);
  SERVICES.forEach(({ partition }) => patchSession(session.fromPartition(partition)));

  const win = new BrowserWindow({
    width: 1600, height: 970,
    minWidth: 800, minHeight: 600,
    backgroundColor: '#121212',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true,
      webSecurity: false,
    },
    title: 'ViceBrain',
  });

  // Set window icon based on platform (only if assets exist)
  if (fs.existsSync(path.join(__dirname, 'assets/windows/icon.ico'))) {
    if (process.platform === 'win32') {
      win.setIcon(path.join(__dirname, 'assets/windows/icon.ico'));
    } else if (process.platform === 'linux') {
      win.setIcon(path.join(__dirname, 'assets/linux/icons/512x512.png'));
    }
  }

  win.loadFile('index.html');

  // Inject preload + wire auth BEFORE webview renderer is created
  win.webContents.on('will-attach-webview', (event, webPrefs, params) => {
    webPrefs.preload  = PRELOAD;
    webPrefs.sandbox  = false;
    webPrefs.nodeIntegration = false;
  });

  // Wire auth interception once attached
  win.webContents.on('did-attach-webview', (_, wvContents) => {
    // Find which partition this webview uses
    const partition = SERVICES.find(s => wvContents.session === session.fromPartition(s.partition))?.partition
                    || 'persist:gemini';
    wireWebview(wvContents, win, partition);
  });

  /* ── IPC: inject prompt ── */
  ipcMain.handle('inject-prompt', async (event, { viewId, prompt, autoSend }) => {
    try {
      const wc = webContents.fromId(viewId);
      if (!wc) return { ok: false, error: 'webContents not found' };
      const script = `
        (function(text, autoSend) {
          const SELS = [
            '#prompt-textarea',                               // ChatGPT
            'div.ql-editor[contenteditable="true"]',         // Gemini old
            'rich-textarea .ql-editor',                       // Gemini
            'ms-input-box div[contenteditable="true"]',       // Gemini
            'div[contenteditable="true"][data-placeholder]',  // Claude
            'div.ProseMirror[contenteditable="true"]',        // Claude
            'textarea#chat-input',                            // Kimi
            'textarea[placeholder]',                          // DeepSeek/Qwen/Mistral/Perplexity
            'textarea[data-testid="search-input"]',          // Perplexity
            'div[contenteditable="true"]',                    // generic
            'textarea:not([aria-hidden])',
          ];
          let el = null;
          for (const s of SELS) {
            const f = document.querySelector(s);
            if (f && f.offsetParent !== null) { el = f; break; }
          }
          if (!el) return { ok: false, error: 'Input not found' };
          el.focus();
          if (el.tagName === 'TEXTAREA') {
            const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
            setter.set.call(el, text);
            el.dispatchEvent(new Event('input',  { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          } else {
            el.innerHTML = '';
            document.execCommand('selectAll', false, null);
            document.execCommand('insertText', false, text);
            el.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true }));
          }
          if (autoSend) {
            setTimeout(() => {
              const BTNS = [
                'button[data-testid="send-button"]',
                'button[aria-label*="send" i]',
                'button[aria-label*="Submit" i]',
                'button[aria-label*="Send" i]',
                'button.send-button',
                'button[type="submit"]',
                'button[data-testid="copilot-answer-button"]',  // Copilot
              ];
              let btn = null;
              for (const s of BTNS) { const b = document.querySelector(s); if (b && !b.disabled) { btn = b; break; } }
              if (btn) btn.click();
              else el.dispatchEvent(new KeyboardEvent('keydown', { key:'Enter', code:'Enter', keyCode:13, bubbles:true, cancelable:true }));
            }, 400);
          }
          return { ok: true };
        })(${JSON.stringify(prompt)}, ${JSON.stringify(autoSend)});
      `;
      return await wc.executeJavaScript(script);
    } catch (e) { return { ok: false, error: e.message }; }
  });

  /* ── IPC: reload a webview ── */
  ipcMain.handle('reload-view', async (event, { viewId }) => {
    try {
      const wc = webContents.fromId(viewId);
      if (wc) wc.reload();
      return { ok: true };
    } catch (e) { return { ok: false }; }
  });
}

/* ── Chromium flags ──────────────────────────────────────────────────────── */
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('allow-running-insecure-content');

/* ── Boot ────────────────────────────────────────────────────────────────── */
app.on('ready', () => {
  cleanLockFiles();
  const ua = session.defaultSession.getUserAgent()
    .replace(/\s*Electron\/[\d.]+/, '')
    .replace(/\s*ai-trio-browser\/[\d.]+/, '');
  session.defaultSession.setUserAgent(ua);
  createWindow();
});

app.on('second-instance', () => {
  const [w] = BrowserWindow.getAllWindows();
  if (w) { if (w.isMinimized()) w.restore(); w.focus(); }
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
