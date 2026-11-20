// Neon Vice cover renderer: lays photos into GTA-style multi-panel posters,
// grades them, and letter-boxes a bold title + subtitle on top. Pure canvas,
// no network, no fonts beyond the system sans stack.

export const LAYOUTS = {
  hero: { panels: 3, label: 'Hero + 2' },
  strips: { panels: 3, label: '3 Strips' },
  grid: { panels: 4, label: '2 x 2 Grid' },
  full: { panels: 1, label: 'Full Bleed' },
};

export const GRADES = {
  sunset: {
    top: 'rgba(255, 94, 58, 0.10)', mid: 'rgba(255, 46, 136, 0.28)',
    bottom: 'rgba(30, 8, 60, 0.55)', band: '#1c0b33', accent: '#ffd166',
  },
  neon: {
    top: 'rgba(0, 229, 255, 0.14)', mid: 'rgba(255, 0, 153, 0.30)',
    bottom: 'rgba(8, 4, 40, 0.62)', band: '#0a0618', accent: '#00e5ff',
  },
  pastel: {
    top: 'rgba(255, 209, 102, 0.12)', mid: 'rgba(255, 143, 171, 0.22)',
    bottom: 'rgba(90, 60, 140, 0.42)', band: '#3b2a63', accent: '#ffffff',
  },
};

export const SIZES = {
  '1080x1080': [1080, 1080, 'Square'],
  '1080x1350': [1080, 1350, 'Portrait'],
  '1920x1080': [1920, 1080, 'Landscape'],
};

/** Panel rectangles for a layout, as fractions of the cover (x, y, w, h). */
export function panelRects(layout, w, h) {
  const g = Math.round(Math.min(w, h) * 0.012); // white gap between panels
  if (layout === 'strips') {
    const pw = (w - g * 2) / 3;
    return [0, 1, 2].map((i) => [g * i + pw * i, 0, pw, h]);
  }
  if (layout === 'grid') {
    const pw = (w - g) / 2, ph = (h - g) / 2;
    return [[0, 0, pw, ph], [pw + g, 0, pw, ph], [0, ph + g, pw, ph], [pw + g, ph + g, pw, ph]];
  }
  if (layout === 'full') return [[0, 0, w, h]];
  // hero: big top panel, two small ones below
  const topH = h * 0.62, botH = h - topH - g;
  const pw = (w - g) / 2;
  return [[0, 0, w, topH], [0, topH + g, pw, botH], [pw + g, topH + g, pw, botH]];
}

export function panelNames(layout) {
  if (layout === 'strips') return ['Panel 1 (left strip)', 'Panel 2 (middle strip)', 'Panel 3 (right strip)'];
  if (layout === 'grid') return ['Panel 1 (top left)', 'Panel 2 (top right)', 'Panel 3 (bottom left)', 'Panel 4 (bottom right)'];
  if (layout === 'full') return ['Panel 1 (full cover)'];
  return ['Panel 1 (hero)', 'Panel 2 (bottom left)', 'Panel 3 (bottom right)'];
}

/** Draws one photo into a rectangle, cover-fit, with zoom and pan offsets. */
export function drawPhotoInto(ctx, img, rect, zoom, ox, oy) {
  const [x, y, w, h] = rect;
  if (!img) {
    // Empty panel: a diagonal sunset placeholder so the layout still reads.
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, '#ff5e3a'); grad.addColorStop(0.55, '#ff2e88'); grad.addColorStop(1, '#2b1155');
    ctx.fillStyle = grad; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `900 ${Math.round(Math.min(w, h) * 0.09)}px system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('+ PHOTO', x + w / 2, y + h / 2);
    return;
  }
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const base = Math.max(w / iw, h / ih) * zoom;
  const dw = iw * base, dh = ih * base;
  const dx = x + (w - dw) / 2 + ox * w;
  const dy = y + (h - dh) / 2 + oy * h;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `900 ${size}px system-ui, sans-serif`;
  while (size > 14 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `900 ${size}px system-ui, sans-serif`;
  }
  return size;
}

function paintTitle(ctx, title, subtitle, w, h, grade) {
  const bandH = h * 0.20;
  const bandY = h - bandH;
  ctx.fillStyle = grade.band;
  ctx.globalAlpha = 0.88;
  ctx.fillRect(0, bandY, w, bandH);
  ctx.globalAlpha = 1;
  // Accent rule above the band.
  ctx.fillStyle = grade.accent;
  ctx.fillRect(0, bandY, w, Math.max(4, h * 0.006));
  const text = (title || '').trim().toUpperCase();
  const cx = w / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (text) {
    const size = fitFont(ctx, text, w * 0.92, h * 0.105);
    ctx.lineWidth = Math.max(3, size * 0.09);
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.shadowColor = 'rgba(255,46,136,0.55)';
    ctx.shadowBlur = size * 0.25;
    ctx.strokeText(text, cx, bandY + bandH * 0.38);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, cx, bandY + bandH * 0.38);
    ctx.shadowBlur = 0;
  }
  const sub = (subtitle || '').trim().toUpperCase();
  if (sub) {
    const size = fitFont(ctx, sub, w * 0.8, h * 0.032);
    ctx.font = `700 ${size}px system-ui, sans-serif`;
    ctx.fillStyle = grade.accent;
    ctx.fillText(sub, cx, bandY + bandH * 0.78);
  }
}

/**
 * Renders the whole cover onto `canvas` (its own pixel size) from a state:
 * { layout, grade, title, subtitle, panels: [{img, zoom, ox, oy}, ...] }.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  ctx.fillStyle = '#12081f';
  ctx.fillRect(0, 0, w, h);
  const rects = panelRects(state.layout, w, h);
  rects.forEach((rect, i) => {
    const p = state.panels[i] || { img: null, zoom: 1.15, ox: 0, oy: 0 };
    drawPhotoInto(ctx, p.img, rect, p.zoom, p.ox, p.oy);
  });
  // Colour grade wash + vignette over the whole cover.
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(0.5, grade.mid);
  wash.addColorStop(1, grade.bottom);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
  paintTitle(ctx, state.title, state.subtitle, w, h, grade);
  return rects;
}

/** Renders the same state at export size onto a fresh offscreen canvas. */
export function renderExport(state, sizeKey) {
  const [w, h] = SIZES[sizeKey] || SIZES['1080x1080'];
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  drawCover(canvas, state);
  return canvas;
}
