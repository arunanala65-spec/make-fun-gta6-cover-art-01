// Neon Vice Cover Studio entry point: builds the editor on the page canvas,
// loads the two sample photos as defaults, and hands screenshot scenes
// (?shot=cover / ?shot=editor) to shots.js when one is requested.
import { createEditor } from './editor.js';
import { runShotScene } from './shots.js';

const canvas = document.getElementById('coverCanvas');
const editor = createEditor(canvas);
const query = new URLSearchParams(location.search);

async function boot() {
  if (query.get('shot')) {
    await runShotScene(query, editor, canvas);
    return;
  }
  // Default scene: pier photo everywhere so the first paint already looks
  // like a finished cover, with the boulevard shot in the side panels.
  await editor.loadSample('pier', true);
  const { loadImageObject } = await import('./editor.js');
  const side = await loadImageObject('samples/boulevard.jpg');
  editor.state.panels[1].img = side;
  editor.state.panels[2].img = side;
  editor.redraw();
}

boot().catch((err) => {
  console.error('Neon Vice failed to start', err);
  editor.redraw();
});
