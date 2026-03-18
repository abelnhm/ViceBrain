async function broadcastPrompt() {
  const promptVal = document.getElementById('prompt').value.trim();
  const autoSend = document.getElementById('autoSend').checked;
  if (!promptVal) { showToast(t('promptVacio')); return; }

  const active = SERVICES.filter(s => enabled[s.id]);
  if (!active.length) { showToast(t('noHayServicios')); return; }

  const btn = document.getElementById('sendBtn');
  btn.disabled = true;
  document.getElementById('sendTxt').textContent = '…';

  let ok = 0, fail = 0;
  await Promise.all(active.map(async s => {
    const wv = document.getElementById('wv-' + s.id);
    if (!wv) { fail++; return; }
    try {
      const res = await ipcRenderer.invoke('inject-prompt', { viewId: wv.getWebContentsId(), prompt: promptVal, autoSend });
      if (res?.ok) {
        ok++;
        const col = document.querySelector(`.col[data-id="${s.id}"]`);
        if (col) { col.classList.remove('flash'); void col.offsetWidth; col.classList.add('flash'); }
      } else fail++;
    } catch { fail++; }
  }));

  const modelWord = ok !== 1 ? t('modelosPlural') : t('modelos');
  showToast(fail === 0
    ? `${t('promptEnviado')} ${ok} ${modelWord}`
    : `${t('promptEnviado')} ${ok} ${t('ok')}  ✗ ${fail} ${t('fallaron')}`, 4000);
  btn.disabled = false;
  document.getElementById('sendTxt').textContent = t('send');
}

function reloadCol(id) {
  document.getElementById('wv-' + id)?.reload();
  const gh = document.getElementById('gh-' + id);
  if (gh) gh.classList.remove('show');
}