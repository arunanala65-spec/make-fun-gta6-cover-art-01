[![Make GTA 6 Cover Art](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/arunanala65-spec/make-fun-gta6-cover-art-01/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/arunanala65-spec/make-fun-gta6-cover-art-01/reward.svg)](https://make.fun/c/gta6-cover-art-01)

# Neon Vice Cover Studio

A GTA-style cover art maker that runs entirely offline in your browser. Drop in your own photos, arrange them in a multi-panel poster layout, add a bold title and subtitle, pick a Vice City colour grade, and export a share-ready PNG.

Built for the [Make GTA 6 Cover Art](https://make.fun/c/gta6-cover-art-01) bounty on [make.fun](https://make.fun). Sign up with my referral link: https://make.fun/r/ce51ph37

## What it does

- **Multi-panel covers** — four layouts: Hero + 2, 3 vertical strips, 2 × 2 grid, and single full-bleed.
- **Any photo** — upload your own photos from your machine (read locally, never uploaded). Fill several panels with one photo or use a different photo per panel. Click a panel to select it, drag inside it or use the zoom / offset sliders to crop and position the photo.
- **Bold caption lettering** — editable title and subtitle, drawn in heavy outlined capitals over a colour band.
- **Colour grades** — Vice City Sunset, Neon Night, and Pastel Day washes with a vignette.
- **Fast export** — one click exports a PNG in 1080 × 1080, 1080 × 1350, or 1920 × 1080.

Everything is original: no Rockstar Games logo, artwork, character, or font anywhere. Only system fonts and canvas drawing, plus two kit-provided sample photos (`app/samples/`) made with an image model and free to use.

## How to run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step, no network needed.

## How to use it

1. Pick a layout and a colour grade.
2. Load photos: click **Sample: Boulevard** / **Sample: Pier**, or choose your own file for the selected panel. **Use one photo everywhere** fills every panel with the same photo.
3. Click a panel in the preview to select it, drag to reposition, or tune zoom and offsets with the sliders.
4. Type your title and subtitle.
5. Choose an export size and hit **Export PNG**.

## Files

- `app/index.html` — the editor page
- `app/src/cover.js` — the cover renderer (layouts, grades, lettering)
- `app/src/editor.js` — editor wiring, photo loading, drag-to-crop, export
- `app/src/shots.js` — fixed `?shot=` scenes used for the screenshots
- `app/src/main.js` — entry point
- `app/samples/` — two free-to-use sample photos
- `screenshots/` — screenshots of the app and its exported covers
