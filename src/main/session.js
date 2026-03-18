const { CHROME_UA } = require('./services');

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

function cleanLockFiles(app, SERVICES) {
  const path = require('path');
  const fs = require('fs');
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

module.exports = {
  patchSession,
  cleanLockFiles
};