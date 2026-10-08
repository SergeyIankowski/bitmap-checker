# Bitmap Font Checker

A simple tool for visually checking BMFont-format bitmap fonts (`.fnt` + PNG/WebP/AVIF atlas). Load a font, type some text, and instantly see it rendered with the actual glyphs, plus a full atlas preview with labeled character codes.

## Features

- Drag & drop or file picker for `.fnt` + texture(s) in PNG, JPEG, WebP or AVIF
- Supports the text BMFont format, including kerning and multi-page atlases
- Renders typed text using the font's real glyphs
- Full atlas preview as a grid with labeled character IDs
- Manually resizable text preview area

## Stack

Vite + TypeScript, no frameworks — rendering is done via `<canvas>`.

## Getting started

```bash
npm install
npm run dev
```

## Other commands

```bash
npm run build     # type-check + production build
npm run preview   # preview the production build locally
npm run lint       # lint with Biome
npm run format     # auto-format with Biome
```

## File format

You need a text-format `.fnt` file (AngelCode BMFont) and the texture(s) it references via `page id=... file="..."`. Drop the `.fnt` and its matching textures together — the app matches atlas pages by file name. If there's no exact match, a file with the same base name but a different extension is used, so e.g. `font_0.webp` or `font_0.avif` will be picked up for `file="font_0.png"`.
