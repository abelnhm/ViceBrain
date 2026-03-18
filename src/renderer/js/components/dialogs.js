let confirmCallback = null;

function showAddServiceDialog() {
  document.getElementById('addServiceDialog').style.display = 'flex';
  document.getElementById('newSvcName').value = '';
  document.getElementById('newSvcUrl').value = '';
  document.getElementById('newSvcColor').value = '#6366f1';
  document.getElementById('newSvcName').focus();
}

function closeAddServiceDialog() {
  document.getElementById('addServiceDialog').style.display = 'none';
}

function confirmAddService() {
  const name = document.getElementById('newSvcName').value.trim();
  const url = document.getElementById('newSvcUrl').value.trim();
  const color = document.getElementById('newSvcColor').value;
  
  if (!name) { showToast(t('nombreRequerido')); return; }
  if (!url) { showToast(t('urlRequerida')); return; }
  
  const id = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (SERVICES.find(s => s.id === id)) { showToast(t('yaExiste')); return; }
  
  const finalUrl = url.startsWith('http') ? url : 'https://' + url;
  const newService = {
    id, name, url: finalUrl, color,
    partition: 'persist:' + id,
    hasGoogle: false, badge: '', favorite: false, custom: true
  };
  
  SERVICES.push(newService);
  enabled[id] = true;
  colWidths[id] = DEF_WIDTH;
  
  storage.set('customServices', SERVICES.filter(s => s.custom));
  closeAddServiceDialog();
  buildSidebar();
  rebuildGrid();
  showToast(`✓ ${name} ${t('servicioAñadido')}`);
}

function showConfirmDialog(title, message, callback) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMessage').textContent = message;
  confirmCallback = callback;
  document.getElementById('confirmDialog').style.display = 'flex';
}

function closeConfirmDialog() {
  document.getElementById('confirmDialog').style.display = 'none';
  confirmCallback = null;
}

function confirmAction() {
  if (confirmCallback) confirmCallback();
  closeConfirmDialog();
}

function deleteCustomService(id) {
  const svc = SERVICES.find(s => s.id === id);
  if (!svc || !svc.custom) return;
  showConfirmDialog(
    t('confirmDelete'),
    `${t('confirmDeleteMsg')} "${svc.name}"?`,
    () => {
      const idx = SERVICES.findIndex(s => s.id === id);
      if (idx !== -1) SERVICES.splice(idx, 1);
      delete enabled[id];
      delete colWidths[id];
      favorites.delete(id);
      storage.set('customServices', SERVICES.filter(s => s.custom));
      storage.set('serviceFavorites', [...favorites]);
      buildSidebar();
      rebuildGrid();
      showToast(`✓ ${svc.name} ${t('servicioEliminado')}`);
    }
  );
}