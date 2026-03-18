const { BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { patchSession } = require('./session');
const { wireWebview } = require('./auth');
const { setupIPC } = require('./ipc');
const { CHROME_UA, PRELOAD_PATH, SERVICES } = require('./services');

function createMainWindow() {
  const { session } = require('electron');
  
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

  if (fs.existsSync(path.join(__dirname, '..', '..', 'assets', 'icons', 'windows', 'icon.ico'))) {
    if (process.platform === 'win32') {
      win.setIcon(path.join(__dirname, '..', '..', 'assets', 'icons', 'windows', 'icon.ico'));
    } else if (process.platform === 'linux') {
      win.setIcon(path.join(__dirname, '..', '..', 'assets', 'icons', 'linux', 'icons', '512x512.png'));
    }
  }

  win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  win.webContents.on('will-attach-webview', (event, webPrefs, params) => {
    webPrefs.preload = PRELOAD_PATH;
    webPrefs.sandbox = false;
    webPrefs.nodeIntegration = false;
  });

  win.webContents.on('did-attach-webview', (_, wvContents) => {
    const partition = SERVICES.find(s => wvContents.session === session.fromPartition(s.partition))?.partition
                    || 'persist:gemini';
    wireWebview(wvContents, win, partition, SERVICES);
  });

  setupIPC(SERVICES);

  return win;
}

module.exports = {
  createMainWindow
};