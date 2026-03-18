const DEF_WIDTH = 380;
const MIN_WIDTH = 200;
const MAX_WIDTH = 1200;
const WIDTH_STEP = 60;

function setLayout(mode) {
  layoutMode = mode;
  document.getElementById('btnCols').classList.toggle('active', mode === 'cols');
  document.getElementById('btnGrid').classList.toggle('active', mode === 'grid');
  document.getElementById('gridCtrl').style.display = mode === 'grid' ? 'flex' : 'none';

  const grid = document.getElementById('grid');
  grid.classList.toggle('mode-cols', mode === 'cols');
  grid.classList.toggle('mode-grid', mode === 'grid');

  const vp = document.getElementById('viewport');
  vp.style.overflowX = mode === 'cols' ? 'auto' : 'hidden';
  vp.style.overflowY = mode === 'cols' ? 'hidden' : 'auto';

  applyLayout();
}

function changeGridCols(delta) {
  gridCols = Math.min(8, Math.max(1, gridCols + delta));
  document.getElementById('gcVal').textContent = gridCols;
  applyLayout();
}

function applyLayout() {
  const grid = document.getElementById('grid');
  if (layoutMode === 'cols') {
    grid.style.height = '100%';
    grid.style.setProperty('--gap', '0px');
    grid.style.setProperty('--gcols', '1');
    SERVICES.filter(s => enabled[s.id]).forEach(s => {
      const col = grid.querySelector(`.col[data-id="${s.id}"]`);
      if (col) {
        col.style.width = colWidths[s.id] + 'px';
        col.style.flexGrow = '1';
      }
    });
  } else {
    grid.style.height = 'auto';
    grid.style.setProperty('--gap', '8px');
    grid.style.setProperty('--gcols', String(gridCols));
    grid.querySelectorAll('.col').forEach(col => {
      col.style.width = '';
      col.style.flexGrow = '1';
    });
  }
}

function changeWidth(id, delta) {
  colWidths[id] = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, colWidths[id] + delta));
  const col = document.querySelector(`.col[data-id="${id}"]`);
  if (col && layoutMode === 'cols') col.style.width = colWidths[id] + 'px';
}

function initResizeHandle(handle, id) {
  let startX, startW;

  handle.addEventListener('mousedown', e => {
    if (layoutMode !== 'cols') return;
    e.preventDefault();
    startX = e.clientX;
    startW = colWidths[id];
    handle.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = e => {
      const dx = e.clientX - startX;
      const nw = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startW + dx));
      colWidths[id] = nw;
      const col = document.querySelector(`.col[data-id="${id}"]`);
      if (col) col.style.width = nw + 'px';
    };
    const onUp = () => {
      handle.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}