function buildSidebar() {
  const list = document.getElementById('sbList');
  list.innerHTML = '';
  const ordered = getOrderedServices();
  const favs = ordered.filter(s => favorites.has(s.id));
  const others = ordered.filter(s => !favorites.has(s.id));
  
  favs.forEach(s => {
    const row = document.createElement('div');
    row.className = 'svc-row' + (enabled[s.id] ? ' on' : '');
    row.id = 'sbrow-' + s.id;
    const badgeClass = s.badge === 'Limited' ? 'limited' : (s.badge === 'Pending' ? 'pending' : '');
    const badgeText = s.badge === 'Limited' ? t('badgeLimited') : (s.badge === 'Pending' ? t('badgePending') : '');
    const badgeHtml = s.badge ? `<span class="svc-badge ${badgeClass}">${badgeText}</span>` : '';
    const deleteBtn = s.custom ? `<span class="svc-delete" data-id="${s.id}" title="Eliminar">✕</span>` : '';
    row.innerHTML = `
      <span class="svc-fav ${favorites.has(s.id) ? 'active' : ''}" data-id="${s.id}" title="Favorito">★</span>
      ${getServiceIcon(s)}
      <div class="svc-name">${s.name}${badgeHtml}</div>
      ${deleteBtn}
      <div class="svc-toggle"></div>`;
    list.appendChild(row);
  });
  
  if (favs.length > 0 && others.length > 0) {
    const divider = document.createElement('div');
    divider.className = 'svc-divider';
    list.appendChild(divider);
  }
  
  others.forEach(s => {
    const row = document.createElement('div');
    row.className = 'svc-row' + (enabled[s.id] ? ' on' : '');
    row.id = 'sbrow-' + s.id;
    const badgeClass = s.badge === 'Limited' ? 'limited' : (s.badge === 'Pending' ? 'pending' : '');
    const badgeText = s.badge === 'Limited' ? t('badgeLimited') : (s.badge === 'Pending' ? t('badgePending') : '');
    const badgeHtml = s.badge ? `<span class="svc-badge ${badgeClass}">${badgeText}</span>` : '';
    const deleteBtn = s.custom ? `<span class="svc-delete" data-id="${s.id}" title="Eliminar">✕</span>` : '';
    row.innerHTML = `
      <span class="svc-fav ${favorites.has(s.id) ? 'active' : ''}" data-id="${s.id}" title="Favorito">★</span>
      ${getServiceIcon(s)}
      <div class="svc-name">${s.name}${badgeHtml}</div>
      ${deleteBtn}
      <div class="svc-toggle"></div>`;
    list.appendChild(row);
  });
}

function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
  document.getElementById('sidebar').classList.toggle('collapsed', !sidebarOpen);
  document.getElementById('toggleSidebar').classList.toggle('on', !sidebarOpen);
  const icon = document.getElementById('sidebarIcon');
  if (icon) icon.textContent = sidebarOpen ? '☰' : '☱';
}

function toggleLoginNote() {
  loginNoteVisible = !loginNoteVisible;
  const note = document.getElementById('loginNote');
  if (loginNoteVisible) note.classList.remove('hidden');
  else note.classList.add('hidden');
  storage.set('loginNoteVisible', loginNoteVisible);
}

function toggleFavorite(id) {
  if (favorites.has(id)) favorites.delete(id);
  else favorites.add(id);
  storage.set('serviceFavorites', [...favorites]);
  buildSidebar();
  rebuildGrid();
}

function toggleService(id) {
  enabled[id] = !enabled[id];
  document.getElementById('sbrow-' + id).classList.toggle('on', enabled[id]);
  storage.set('enabledServices', Object.keys(enabled).filter(k => enabled[k]));
  rebuildGrid();
}

function toggleAll(on) {
  SERVICES.forEach(s => {
    enabled[s.id] = on;
    const row = document.getElementById('sbrow-' + s.id);
    if (row) row.classList.toggle('on', on);
  });
  storage.set('enabledServices', Object.keys(enabled).filter(k => enabled[k]));
  rebuildGrid();
}

function getOrderedServices() {
  const favs = SERVICES.filter(s => favorites.has(s.id));
  const others = SERVICES.filter(s => !favorites.has(s.id));
  return [...favs, ...others];
}

function getServiceIcon(s) {
  if (useIcons) {
    return `<img class="svc-icon" src="${getFaviconUrl(s.url)}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'" />
            <div class="svc-dot" style="background:${s.color};display:none"></div>`;
  }
  return `<div class="svc-dot" style="background:${s.color}"></div>`;
}

function getFaviconUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch (e) { return ''; }
}