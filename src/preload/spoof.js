'use strict';
(function () {
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

  const nav = (k, v) => { try { Object.defineProperty(navigator, k, { get: () => v, configurable: true }); } catch (_) {} };
  nav('userAgent',   UA);
  nav('appVersion',  UA.replace('Mozilla/', ''));
  nav('vendor',      'Google Inc.');
  nav('platform',    'Win32');
  nav('webdriver',   false);
  nav('hardwareConcurrency', 8);
  nav('deviceMemory', 8);
  nav('languages', ['en-US', 'en']);
  nav('language', 'en-US');
  nav('languages', ['en-US', 'en']);
  nav('plugins', (() => {
    const a = [{ name: 'PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' }];
    a.namedItem = n => a.find(p => p.name === n) || null;
    a.item      = i => a[i] || null;
    a.refresh   = () => {};
    return a;
  })());
  nav('mimeTypes', (() => {
    const a = [{ type: 'application/pdf', description: 'PDF', suffixes: 'pdf' }];
    a.namedItem = n => a.find(m => m.type === n) || null;
    a.item      = i => a[i] || null;
    return a;
  })());
  nav('maxTouchPoints', 0);
  nav('pdfViewerEnabled', true);

  try {
    Object.defineProperty(window, 'outerWidth', { get: () => 1920, configurable: true });
    Object.defineProperty(window, 'outerHeight', { get: () => 1080, configurable: true });
    Object.defineProperty(window, 'innerWidth', { get: () => 1920, configurable: true });
    Object.defineProperty(window, 'innerHeight', { get: () => 1080, configurable: true });
    Object.defineProperty(window, 'screenX', { get: () => 0, configurable: true });
    Object.defineProperty(window, 'screenY', { get: () => 0, configurable: true });
    Object.defineProperty(window, 'screenLeft', { get: () => 0, configurable: true });
    Object.defineProperty(window, 'screenTop', { get: () => 0, configurable: true });
  } catch (_) {}

  ['process','require','module','__electron','nodeRequire','Buffer','global','globalThis'].forEach(k => {
    try { delete window[k]; } catch (_) {}
    try { Object.defineProperty(window, k, { get: () => undefined, set: () => {}, configurable: true, enumerable: false }); } catch (_) {}
  });

  if (!window.chrome) {
    window.chrome = {
      app: { isInstalled: false },
      runtime: {
        connect: () => ({ onDisconnect: {}, onMessage: {}, postMessage: () => {}, disconnect: () => {} }),
        sendMessage: () => {},
        id: ''
      },
      loadTimes: () => ({}),
      csi: () => ({}),
      webstore: { onInstallStageChanged: {}, onDownloadProgress: {} },
    };
  }

  if (navigator.permissions && navigator.permissions.query) {
    const _q = navigator.permissions.query.bind(navigator.permissions);
    navigator.permissions.query = p =>
      p && p.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission, onchange: null })
        : _q(p);
  }
})();