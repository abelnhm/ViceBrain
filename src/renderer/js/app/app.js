const { ipcRenderer } = require('electron');

const enabled = {};
const colWidths = {};
let layoutMode = 'cols';
let gridCols = 3;
let sidebarOpen = true;
let useIcons = true;
let currentLang = 'es';
let isDarkMode = true;
const favorites = new Set();
let loginNoteVisible = true;

function initTheme() {
  try { isDarkMode = storage.get('theme', true); }
  catch(e) {}
  document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  document.getElementById('themeIcon').textContent = isDarkMode ? '🌙' : '☀️';
}

function toggleTheme() {
  isDarkMode = !isDarkMode;
  document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  storage.set('theme', isDarkMode ? 'dark' : 'light');
  document.getElementById('themeIcon').textContent = isDarkMode ? '🌙' : '☀️';
}

function initLanguage() {
  try { currentLang = storage.get('language', 'es'); }
  catch(e) {}
  document.getElementById('currentLangFlag').textContent = currentLang === 'es' ? '🇪🇸' : '🇬🇧';
}

function toggleLanguage() {
  currentLang = currentLang === 'es' ? 'en' : 'es';
  storage.set('language', currentLang);
  updateAllTranslations();
  document.getElementById('currentLangFlag').textContent = currentLang === 'es' ? '🇪🇸' : '🇬🇧';
}

function updateAllTranslations() {
  document.getElementById('lblServicios').textContent = t('servicios');
  document.getElementById('loginNote').innerHTML = t('loginNote');
  document.getElementById('btnActivarTodos').textContent = t('activarTodos');
  document.getElementById('btnDesactivarTodos').textContent = t('desactivarTodos');
  document.getElementById('btnAddService').textContent = t('addService');
  document.getElementById('empty').innerHTML = `<p>${t('sinServicios')}</p><p style="font-size:.62rem;margin-top:4px">${t('activaDesdePanel')}</p>`;
  document.getElementById('metaLbl').textContent = t('broadcast');
  document.getElementById('autoSendLabel').textContent = t('autoSend');
  document.getElementById('prompt').placeholder = t('promptPlaceholder');
  document.getElementById('sendTxt').textContent = t('send');
  document.getElementById('lblCols').textContent = t('lblCols');
  document.getElementById('lblGrid').textContent = t('lblGrid');
  const serviciosBtn = document.getElementById('lblServiciosBtn');
  if (serviciosBtn) serviciosBtn.textContent = t('serviciosBtn');
  document.getElementById('dialogTitle').textContent = t('addSvcTitle');
  document.getElementById('dialogNameLabel').textContent = t('svcName');
  document.getElementById('dialogUrlLabel').textContent = t('svcUrl');
  document.getElementById('dialogColorLabel').textContent = t('svcColor');
  document.getElementById('newSvcName').placeholder = t('svcNamePlaceholder');
  document.getElementById('newSvcUrl').placeholder = t('svcUrlPlaceholder');
  document.getElementById('btnCancelAdd').textContent = t('cancel');
  document.getElementById('btnConfirmAdd').textContent = t('add');
  document.getElementById('confirmTitle').textContent = t('confirmDelete');
  document.getElementById('btnConfirmAction').textContent = t('confirm');
  buildSidebar();
}

function initServices() {
  try {
    const savedCustom = storage.get('customServices', []);
    savedCustom.forEach(s => {
      if (!SERVICES.find(existing => existing.id === s.id)) SERVICES.push(s);
    });
  } catch(e) {}

  try { favorites.clear(); storage.get('serviceFavorites', []).forEach(id => favorites.add(id)); } catch(e) {}
  try { useIcons = storage.get('useIcons', true); } catch(e) {}

  const savedEnabled = storage.get('enabledServices', null);
  if (savedEnabled) {
    SERVICES.forEach(s => {
      enabled[s.id] = savedEnabled.includes(s.id);
      colWidths[s.id] = DEF_WIDTH;
      if (s.favorite) favorites.add(s.id);
    });
  } else {
    SERVICES.forEach((s, i) => {
      enabled[s.id] = i < 3;
      colWidths[s.id] = DEF_WIDTH;
      if (s.favorite) favorites.add(s.id);
    });
  }
}

function toggleIconMode() {
  useIcons = !useIcons;
  storage.set('useIcons', useIcons);
  buildSidebar();
}

function initLoginNote() {
  try {
    const saved = storage.get('loginNoteVisible', true);
    loginNoteVisible = saved;
    if (!saved) document.getElementById('loginNote').classList.add('hidden');
  } catch(e) {}
}

function showToast(msg, dur = 3500) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), dur);
}

let toastTimeout;

function rebuildGrid() {
  const ordered = getOrderedServices();
  const active = ordered.filter(s => enabled[s.id]);
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');

  document.getElementById('activeDots').innerHTML = active.map((s,i) =>
    `<div class="adot" style="background:${s.color};animation-delay:${i*.12}s"></div>`
  ).join('');

  const dotsHtml = active.map(s => {
    if (useIcons) {
      return `<img class="btn-dot" src="${getFaviconUrl(s.url)}" style="width:8px;height:8px;border-radius:2px;object-fit:contain;background:#fff" onerror="this.style.display='none'" />`;
    }
    return `<div class="btn-dot" style="background:${s.color}"></div>`;
  }).join('');
  document.getElementById('btnDots').innerHTML = dotsHtml;

  if (!active.length) { grid.style.display = 'none'; empty.classList.add('show'); return; }
  grid.style.display = 'flex'; empty.classList.remove('show');

  [...grid.querySelectorAll('.col')].forEach(col => {
    if (!enabled[col.dataset.id]) col.remove();
  });

  active.forEach(s => {
    if (!grid.querySelector(`.col[data-id="${s.id}"]`)) grid.appendChild(makeColumn(s));
  });

  active.forEach(s => {
    const el = grid.querySelector(`.col[data-id="${s.id}"]`);
    if (el) grid.appendChild(el);
  });

  applyLayout();
}

function makeColumn(s) {
  const col = document.createElement('div');
  col.className = 'col';
  col.dataset.id = s.id;
  col.style.setProperty('--accent', s.color + '55');
  col.style.width = colWidths[s.id] + 'px';

  col.innerHTML = `
    <div class="chrome">
      <div class="tls">
        <div class="tl tl-r"></div><div class="tl tl-y"></div><div class="tl tl-g"></div>
      </div>
      <div class="url-bar">
        <svg class="lock" width="8" height="9" viewBox="0 0 8 9" fill="none">
          <rect x="1" y="4" width="6" height="4.5" rx="1" fill="currentColor"/>
          <path d="M2 4V2.8A2 2 0 0 1 6 2.8V4" stroke="currentColor" stroke-width="1" fill="none"/>
        </svg>
        ${(function(){try{return new URL(s.url).hostname;}catch(e){return s.url;}})()}
      </div>
      <div class="w-ctrl">
        <button class="w-btn" data-id="${s.id}" data-delta="-${WIDTH_STEP}" title="Reducir ancho">−</button>
        <button class="w-btn" data-id="${s.id}" data-delta="+${WIDTH_STEP}" title="Aumentar ancho">+</button>
      </div>
      <button class="reload-btn" data-id="${s.id}" title="Recargar">↺</button>
      <div class="ai-tag" style="background:${s.color}18;color:${s.color};border:1px solid ${s.color}30">
        ${s.name.toUpperCase()}
      </div>
    </div>
    <div class="loadbar" id="lb-${s.id}" style="background:${s.color}"></div>
    <webview
      id="wv-${s.id}"
      src="${s.url}"
      partition="${s.partition}"
      allowpopups
      useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ></webview>
    <div class="google-hint" id="gh-${s.id}">
      <span>🔑 Completa el login en tu navegador → luego recarga</span>
      <button data-id="${s.id}">↺ Recargar</button>
    </div>
    <div class="statusbar">
      <div class="stsdot loading" id="sd-${s.id}"></div>
      <div class="stslabel" id="sl-${s.id}">Cargando…</div>
    </div>
    <div class="resize-handle" id="rh-${s.id}"></div>`;

  requestAnimationFrame(() => {
    const wv = document.getElementById('wv-' + s.id);
    if (!wv) return;
    wv.addEventListener('did-start-loading', () => {
      const lb = document.getElementById('lb-' + s.id);
      if (lb) lb.classList.add('loading');
      setStatus(s.id, 'loading', 'Cargando…');
    });
    wv.addEventListener('did-stop-loading', () => {
      const lb = document.getElementById('lb-' + s.id);
      if (lb) lb.classList.remove('loading');
      setStatus(s.id, 'ready', wv.getURL() || 'Listo');
    });
    wv.addEventListener('did-fail-load', e => {
      if (e.errorCode === -3) return;
      const lb = document.getElementById('lb-' + s.id);
      if (lb) lb.classList.remove('loading');
      setStatus(s.id, 'error', 'Error: ' + e.errorDescription);
    });
    wv.addEventListener('page-title-updated', e => setStatus(s.id, 'ready', e.title || wv.getURL()));

    const rh = document.getElementById('rh-' + s.id);
    if (rh) initResizeHandle(rh, s.id);
  });

  return col;
}

function setStatus(id, cls, txt) {
  const sd = document.getElementById('sd-' + id);
  const sl = document.getElementById('sl-' + id);
  if (sd) sd.className = 'stsdot ' + cls;
  if (sl) sl.textContent = txt;
}

function initEventListeners() {
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  document.getElementById('langToggle').addEventListener('click', toggleLanguage);
  document.getElementById('toggleSidebar').addEventListener('click', toggleSidebar);
  document.getElementById('btnToggleIcons').addEventListener('click', toggleIconMode);
  document.getElementById('btnCols').addEventListener('click', () => setLayout('cols'));
  document.getElementById('btnGrid').addEventListener('click', () => setLayout('grid'));
  document.getElementById('btnColsMinus').addEventListener('click', () => changeGridCols(-1));
  document.getElementById('btnColsPlus').addEventListener('click', () => changeGridCols(+1));
  document.getElementById('btnAddService').addEventListener('click', showAddServiceDialog);
  document.getElementById('btnActivarTodos').addEventListener('click', () => toggleAll(true));
  document.getElementById('btnDesactivarTodos').addEventListener('click', () => toggleAll(false));
  document.getElementById('btnCancelAdd').addEventListener('click', closeAddServiceDialog);
  document.getElementById('btnConfirmAdd').addEventListener('click', confirmAddService);
  document.getElementById('btnCancelConfirm').addEventListener('click', closeConfirmDialog);
  document.getElementById('btnConfirmAction').addEventListener('click', confirmAction);
  document.getElementById('sendBtn').addEventListener('click', broadcastPrompt);
  document.getElementById('loginNote').querySelector('.login-note-toggle').addEventListener('click', toggleLoginNote);

  document.getElementById('sbList').addEventListener('click', e => {
    const row = e.target.closest('.svc-row');
    if (e.target.classList.contains('svc-fav')) toggleFavorite(e.target.dataset.id);
    else if (e.target.classList.contains('svc-delete')) deleteCustomService(e.target.dataset.id);
    else if (row) toggleService(row.id.replace('sbrow-', ''));
  });

  document.getElementById('grid').addEventListener('click', e => {
    if (e.target.classList.contains('reload-btn')) reloadCol(e.target.dataset.id);
    if (e.target.classList.contains('google-hint button')) reloadCol(e.target.dataset.id);
  });

  document.getElementById('grid').addEventListener('click', e => {
    const btn = e.target.closest('.w-btn');
    if (btn) changeWidth(btn.dataset.id, parseInt(btn.dataset.delta));
  });

  document.getElementById('prompt').addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); broadcastPrompt(); }
  });

  const ta = document.getElementById('prompt');
  ta.addEventListener('input', () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'; });

  document.getElementById('newSvcName').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); document.getElementById('newSvcUrl').focus(); }
  });
  document.getElementById('newSvcUrl').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); confirmAddService(); }
  });

  ipcRenderer.on('google-auth-opened', (_, partition) => {
    const s = SERVICES.find(x => x.partition === partition);
    if (s) document.getElementById('gh-' + s.id)?.classList.add('show');
    showToast('🔑 Login de Google abierto en el navegador — recarga cuando termines');
  });

  ipcRenderer.on('auth-popup-closed', (_, partition) => {
    const s = SERVICES.find(x => x.partition === partition);
    if (s) setTimeout(() => reloadCol(s.id), 600);
  });
}

initTheme();
initLanguage();
initLoginNote();
initServices();
initEventListeners();
checkLegalAccept();
buildSidebar();
rebuildGrid();
setLayout('cols');
document.getElementById('btnToggleIcons').textContent = useIcons ? '◐' : '◑';

function checkLegalAccept() {
  try {
    const accepted = storage.get('legalAccepted', false);
    if (!accepted) {
      document.getElementById('legalDialog').style.display = 'flex';
      document.getElementById('btnAcceptLegal').addEventListener('click', () => {
        storage.set('legalAccepted', true);
        document.getElementById('legalDialog').style.display = 'none';
      });
    }
  } catch(e) {}
}