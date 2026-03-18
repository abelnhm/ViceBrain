const { shell, session } = require('electron');
const { CHROME_UA, PRELOAD_PATH } = require('./services');
const { patchSession } = require('./session');

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
  const { BrowserWindow } = require('electron');
  
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
      preload: PRELOAD_PATH,
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

function wireWebview(wvContents, win, partition, SERVICES) {
  wvContents.setUserAgent(CHROME_UA);

  const handleURL = (url, preventDefault) => {
    if (!url || url === 'about:blank') return;
    if (isGoogleAuth(url)) {
      if (preventDefault) preventDefault();
      shell.openExternal(url);
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

module.exports = {
  isGoogleAuth,
  isOtherAuth,
  openAuthPopup,
  wireWebview
};