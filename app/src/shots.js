// Screenshot scenes for the entry's screenshots. ?shot=cover shows only the
// finished cover, full-bleed; ?shot=editor shows the editor with a photo
// loaded. Params: photo (boulevard|pier), caption, subtitle, layout, grade,
// size. window.__shotReady is set once the scene has painted.

import { loadImageObject } from './editor.js';
import { SIZES } from './cover.js';

export async function runShotScene(query, editor, canvas) {
  const { state, redraw, loadSample } = editor;
  const shot = query.get('shot');
  if (shot === 'cover') document.body.classList.add('shot-cover');
  state.title = query.get('caption') || 'SUNSET HEIST';
  state.subtitle = query.get('subtitle') || 'VICE CITY · SUMMER 2026';
  state.layout = query.get('layout') || 'hero';
  state.grade = query.get('grade') || 'sunset';
  state.sizeKey = query.get('size') || '1080x1080';
  if (shot === 'cover') {
    // Draw the cover at its real export aspect so the screenshot is the
    // cover itself, undistorted, at the shot window's size.
    const [cw, ch] = SIZES[state.sizeKey];
    canvas.width = cw;
    canvas.height = ch;
  }
  document.getElementById('titleInput').value = state.title;
  document.getElementById('subtitleInput').value = state.subtitle;
  document.querySelectorAll('#layoutRow button').forEach((b) =>
    b.classList.toggle('on', b.dataset.layout === state.layout));
  document.querySelectorAll('#gradeRow button').forEach((b) =>
    b.classList.toggle('on', b.dataset.grade === state.grade));
  document.querySelectorAll('#sizeRow button').forEach((b) =>
    b.classList.toggle('on', b.dataset.size === state.sizeKey));
  const photo = query.get('photo') || 'pier';
  const second = query.get('photo2') || 'boulevard';
  const firstImg = await loadSample(photo, false);
  // Fill the other panels with the second sample so multi-panel layouts read.
  for (let i = 1; i < state.panels.length; i++) {
    if (!state.panels[i].img) state.panels[i].img = firstImg;
  }
  if (second !== photo) {
    const img2 = await loadImageObject(`samples/${second}.jpg`);
    state.panels[1].img = img2;
  }
  if (state.layout === 'hero') {
    // The hero panel is wide: nudge the first photo down so a face near
    // the top of the sample photo stays in frame instead of being cropped.
    state.panels[0].oy = 0.32;
  }
  redraw();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
