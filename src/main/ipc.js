const { ipcMain, webContents } = require('electron');
const { CHROME_UA } = require('./services');

const INJECT_PROMPT_SCRIPT = `
(function(text, autoSend) {
  const SELS = [
    '#prompt-textarea',
    'div.ql-editor[contenteditable="true"]',
    'rich-textarea .ql-editor',
    'ms-input-box div[contenteditable="true"]',
    'div[contenteditable="true"][data-placeholder]',
    'div.ProseMirror[contenteditable="true"]',
    'textarea#chat-input',
    'textarea[placeholder]',
    'textarea[data-testid="search-input"]',
    'div[contenteditable="true"]',
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
        'button[data-testid="copilot-answer-button"]',
      ];
      let btn = null;
      for (const s of BTNS) { const b = document.querySelector(s); if (b && !b.disabled) { btn = b; break; } }
      if (btn) btn.click();
      else el.dispatchEvent(new KeyboardEvent('keydown', { key:'Enter', code:'Enter', keyCode:13, bubbles:true, cancelable:true }));
    }, 400);
  }
  return { ok: true };
})
`;

function setupIPC(SERVICES) {
  ipcMain.handle('inject-prompt', async (event, { viewId, prompt, autoSend }) => {
    try {
      const wc = webContents.fromId(viewId);
      if (!wc) return { ok: false, error: 'webContents not found' };
      const script = `${INJECT_PROMPT_SCRIPT}(${JSON.stringify(prompt)}, ${JSON.stringify(autoSend)});`;
      return await wc.executeJavaScript(script);
    } catch (e) { return { ok: false, error: e.message }; }
  });

  ipcMain.handle('reload-view', async (event, { viewId }) => {
    try {
      const wc = webContents.fromId(viewId);
      if (wc) wc.reload();
      return { ok: true };
    } catch (e) { return { ok: false }; }
  });
}

module.exports = {
  setupIPC,
  INJECT_PROMPT_SCRIPT
};