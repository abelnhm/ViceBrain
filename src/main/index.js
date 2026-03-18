const { app, session } = require('electron');
const { createMainWindow } = require('./window');
const { cleanLockFiles } = require('./session');
const { SERVICES } = require('./services');

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('allow-running-insecure-content');

app.on('ready', () => {
  cleanLockFiles(app, SERVICES);
  const ua = session.defaultSession.getUserAgent()
    .replace(/\s*Electron\/[\d.]+/, '')
    .replace(/\s*ai-trio-browser\/[\d.]+/, '');
  session.defaultSession.setUserAgent(ua);
  createMainWindow();
});

app.on('second-instance', () => {
  const [w] = require('electron').BrowserWindow.getAllWindows();
  if (w) { if (w.isMinimized()) w.restore(); w.focus(); }
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (require('electron').BrowserWindow.getAllWindows().length === 0) createMainWindow(); });