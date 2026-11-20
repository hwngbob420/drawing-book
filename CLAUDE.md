# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Vietnamese-language kids' coloring app ("Sách Tô Màu Phép Thuật"): plain TypeScript + HTML5 Canvas, no UI framework (Vite only bundles). `README.md` (Vietnamese) is detailed and current — read it for the module tour, licensing, and the full list of render-check commands.

## Commands

```bash
npm run dev            # Vite dev server on :5173 (also configured in .claude/launch.json as "dev")
npm run build          # tsc --noEmit + vite build -> dist/  (this is the type check; there is no lint or test suite)
npm run build:single   # build + scripts/build-single.mjs -> dist-single/magic-coloring-book.html (all JS/CSS/SVG inlined)
node scripts/storybook/index.mjs   # regenerate public/svg/story/*.svg from scripts/storybook/*.mjs
node scripts/storybook/render.mjs stickers out/stickers.png   # headless visual check + stroke lint; also: scenes | builder | full | manifest
node scripts/artists/convert.mjs   # convert artist SVGs listed in scripts/artists/catalog.json (needs dev server running)
```

`render.mjs` needs the dev server up plus `playwright-core` + Chromium (not in package.json); `--url` for another port, `--only a,b` to filter. There are no unit tests, so verify visual/engine changes by running the dev server or `render.mjs`.

## Architecture (big picture)

**Line art is the single source of truth.** Everything — built-in scenes, builder-composed scenes, dropped-in `public/artworks/*.svg`, user-uploaded PNG/JPG — ends up as a transparent black-ink line-art canvas (layer 3). Colouring is a separate layer underneath, so lines are never overpainted. The 4 canvas layers (paper / color / magic FX / line art, 1600×1200 or 1200×1600) are described in README.

Flow of a scene:
1. **Sticker library** — `scripts/storybook/*.mjs` hand-draws shapes (viewBox 256, Catmull-Rom splines, ink `#231F20`, white fills, stroke 4 outer / 2.2 inner) via `engine.mjs`; `index.mjs` writes them to `public/svg/story/` (committed, generated output — edit the `.mjs`, not the SVG). `engine.mjs` header documents the conventions (min region size `MIN_REGION`, `data-eye`/`data-nose` solid-ink exemption, draw order = occlusion order). Sibling sources: `public/svg/artist/` (converted artist art) and `public/svg/noto|openmoji/` (legacy/UI).
2. **Composition** — `src/engine/SceneComposer.ts` normalizes each SVG, rasterizes, converts darkness to alpha, and erases strokes hidden behind shapes drawn later. Scenes are declared as `SceneLayer[]` in `src/data/BuiltInArtworks.ts` (id `'s:<name>'` = story sticker, `'a:<name>'` = artist sticker). The Magic Workshop path (`src/builder/`: `SceneDecisionTree` → `ProgressiveSceneComposer`) builds scenes procedurally; saved as "recipes", not images.
3. **Whole-page SVGs** — `src/engine/SvgLineArtConverter.ts` turns arbitrary colour SVGs (declared in `public/artworks/manifest.json`) into the same line-art style at load time.
4. **Painting** — `FloodFillEngine` labels every closed region once when a picture opens (with gap-closing, so taps are just label lookups); `PaintEngine` applies `Action`s; `TimelapseRecorder` keeps the action history that drives Undo/Redo/timelapse; `RippleAnimator`/`PatternGenerator` handle the visual effects and materials.
5. **UI** — `src/main.ts` switches Gallery ↔ Studio; `src/studio/` (FullBleedStudioView, ViewportController for pan/zoom/gestures, FloatingDock); progress and uploads persist via `src/data/Storage.ts` (IndexedDB + localStorage).

## Gotchas

- Hero characters in the builder must each declare exactly 3 `companions` and 3 `backdrops` (`SceneDecisionTree.ts`).
- Faces need `size` ≥ ~230 on the 1600 canvas so every fillable region is ≥ 25px (the render lint flags smaller ones in red).
- Scene layout rule: one large main character (~60% of height) + one smaller companion facing it; background = 2–3 hills + 1–2 differently shaped clouds.
- Bumping an artwork's `version` in `manifest.json` discards saved progress for that `id`.
- `.refs/`, `dist/`, `dist-single/` are gitignored; `.claude/skills/` holds illustration skills used as references for the storybook art.
- UI strings and comments are in Vietnamese; follow that when adding user-facing text.
