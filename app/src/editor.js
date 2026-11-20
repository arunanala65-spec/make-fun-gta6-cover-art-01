// Neon Vice editor: wires the controls to the cover state, loads photos
// (samples or the user's own files, read locally, never uploaded), lets the
// user pick a panel by clicking the preview or dragging inside it, and
// exports the finished cover as a PNG at the chosen post size.

import { LAYOUTS, panelNames, panelRects, drawCover, renderExport, SIZES } from './cover.js';

export function loadImageObject(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function blankPanel() {
  return { img: null, zoom: 1.15, ox: 0, oy: 0 };
}

export function freshState() {
  return {
    layout: 'hero',
    grade: 'sunset',
    title: 'SUNSET HEIST',
    subtitle: 'VICE CITY · SUMMER 2026',
    sizeKey: '1080x1080',
    panels: [blankPanel(), blankPanel(), blankPanel(), blankPanel()],
    selected: 0,
  };
}

export function panelCount(state) {
  return LAYOUTS[state.layout].panels;
}

export function createEditor(canvas) {
  const state = freshState();
  const $ = (id) => document.getElementById(id);
  const titleInput = $('titleInput');
  const subtitleInput = $('subtitleInput');
  const zoomRange = $('zoomRange');
  const xRange = $('xRange');
  const yRange = $('yRange');

  function selectedPanel() {
    return state.panels[state.selected];
  }

  function syncPanelControls() {
    const p = selectedPanel();
    zoomRange.value = p.zoom;
    xRange.value = p.ox;
    yRange.value = p.oy;
    $('zoomVal').textContent = `${Number(p.zoom).toFixed(2)}×`;
    $('panelName').textContent = panelNames(state.layout)[state.selected] || 'Panel 1';
  }

  function redraw() {
    if (state.selected >= panelCount(state)) state.selected = 0;
    drawCover(canvas, state);
    const [w, h, label] = SIZES[state.sizeKey];
    $('sizeLabel').textContent = `${w} × ${h} · ${label}`;
    syncPanelControls();
  }

  function markButtons(rowId, attr, value) {
    document.querySelectorAll(`#${rowId} button`).forEach((b) => {
      b.classList.toggle('on', b.dataset[attr] === value);
    });
  }

  titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
  subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });

  $('layoutRow').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-layout]');
    if (!b) return;
    state.layout = b.dataset.layout;
    state.selected = 0;
    markButtons('layoutRow', 'layout', state.layout);
    redraw();
  });
  $('gradeRow').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-grade]');
    if (!b) return;
    state.grade = b.dataset.grade;
    markButtons('gradeRow', 'grade', state.grade);
    redraw();
  });
  $('sizeRow').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-size]');
    if (!b) return;
    state.sizeKey = b.dataset.size;
    markButtons('sizeRow', 'size', state.sizeKey);
    redraw();
  });

  zoomRange.addEventListener('input', () => { selectedPanel().zoom = Number(zoomRange.value); redraw(); });
  xRange.addEventListener('input', () => { selectedPanel().ox = Number(xRange.value); redraw(); });
  yRange.addEventListener('input', () => { selectedPanel().oy = Number(yRange.value); redraw(); });
  $('resetPanel').addEventListener('click', () => {
    const kept = selectedPanel().img;
    state.panels[state.selected] = blankPanel();
    state.panels[state.selected].img = kept;
    redraw();
  });

  async function setPanelPhoto(index, img) {
    state.panels[index].img = img;
    state.selected = index;
    redraw();
  }

  $('panelFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = await loadImageObject(URL.createObjectURL(file));
    await setPanelPhoto(state.selected, img);
    e.target.value = '';
  });

  async function loadSample(name, applyToAll) {
    const img = await loadImageObject(`samples/${name}.jpg`);
    if (applyToAll) {
      for (let i = 0; i < panelCount(state); i++) state.panels[i].img = img;
    } else {
      state.panels[state.selected].img = img;
    }
    redraw();
    return img;
  }
  $('sampleBoulevard').addEventListener('click', () => loadSample('boulevard', false));
  $('samplePier').addEventListener('click', () => loadSample('pier', false));
  $('applyAll').addEventListener('click', async () => {
    const first = state.panels.find((p) => p.img);
    if (first) {
      for (let i = 0; i < panelCount(state); i++) state.panels[i].img = first.img;
      redraw();
    } else {
      await loadSample('pier', true);
    }
  });

  // Click a panel to select it; drag inside it to pan the photo.
  let drag = null;
  function panelAt(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    const px = ((clientX - r.left) / r.width) * canvas.width;
    const py = ((clientY - r.top) / r.height) * canvas.height;
    const rects = panelRects(state.layout, canvas.width, canvas.height);
    const i = rects.findIndex(([x, y, w, h]) => px >= x && px <= x + w && py >= y && py <= y + h);
    return { index: i, px, py, rect: rects[i] };
  }
  canvas.addEventListener('pointerdown', (e) => {
    const hit = panelAt(e.clientX, e.clientY);
    if (hit.index < 0) return;
    state.selected = hit.index;
    const p = selectedPanel();
    drag = { x: hit.px, y: hit.py, ox: p.ox, oy: p.oy, rect: hit.rect };
    canvas.setPointerCapture(e.pointerId);
    redraw();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const hit = panelAt(e.clientX, e.clientY);
    const p = selectedPanel();
    p.ox = Math.max(-0.5, Math.min(0.5, drag.ox + (hit.px - drag.x) / drag.rect[2]));
    p.oy = Math.max(-0.5, Math.min(0.5, drag.oy + (hit.py - drag.y) / drag.rect[3]));
    redraw();
  });
  canvas.addEventListener('pointerup', () => { drag = null; });

  $('exportBtn').addEventListener('click', () => {
    const out = renderExport(state, state.sizeKey);
    out.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `neon-vice-cover-${state.sizeKey}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }, 'image/png');
  });

  return { state, redraw, loadSample, setPanelPhoto };
}
