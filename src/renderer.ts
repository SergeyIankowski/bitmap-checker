import type { BmChar } from "./fnt-parser";
import type { FontAtlas } from "./font-atlas";

const ATLAS_PADDING = 6;
const ATLAS_LABEL_HEIGHT = 12;
const ATLAS_MAX_COLUMNS = 16;

function charAdvance(
  font: FontAtlas["font"],
  id: number,
  prevId: number | null,
): number {
  const bmChar = font.chars.get(id);
  if (!bmChar) return 0;
  const kerning = prevId !== null ? (font.kernings.get(`${prevId}_${id}`) ?? 0) : 0;
  return kerning + bmChar.xadvance;
}

function measureLine(font: FontAtlas["font"], line: string): number {
  let width = 0;
  let prevId: number | null = null;
  for (const ch of line) {
    const id = ch.codePointAt(0);
    if (id === undefined) continue;
    width += charAdvance(font, id, prevId);
    prevId = id;
  }
  return width;
}

interface LineExtent {
  right: number;
  bottom: number;
}

function measureLineExtent(font: FontAtlas["font"], line: string): LineExtent {
  let penX = 0;
  let prevId: number | null = null;
  let right = 0;
  let bottom = 0;

  for (const ch of line) {
    const id = ch.codePointAt(0);
    if (id === undefined) continue;
    const bmChar = font.chars.get(id);
    if (bmChar) {
      if (prevId !== null) {
        penX += font.kernings.get(`${prevId}_${id}`) ?? 0;
      }
      right = Math.max(right, penX + bmChar.xoffset + bmChar.width);
      bottom = Math.max(bottom, bmChar.yoffset + bmChar.height);
      penX += bmChar.xadvance;
    }
    prevId = id;
  }

  return { right, bottom };
}

function wrapIntoLines(
  atlas: FontAtlas,
  text: string,
  maxWidth: number,
): string[] {
  const { font } = atlas;
  const lines: string[] = [];

  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(" ");
    let currentLine = "";

    for (const word of words) {
      const candidate = currentLine === "" ? word : `${currentLine} ${word}`;
      if (currentLine !== "" && measureLine(font, candidate) > maxWidth) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = candidate;
      }
    }

    lines.push(currentLine);
  }

  return lines;
}

export function renderText(
  ctx: CanvasRenderingContext2D,
  atlas: FontAtlas,
  text: string,
  maxWidth = Infinity,
): void {
  const canvas = ctx.canvas;
  const { font, pageImages } = atlas;
  const lines = wrapIntoLines(atlas, text, maxWidth);
  const extents = lines.map((line) => measureLineExtent(font, line));
  const contentWidth = Math.max(1, ...extents.map((e) => e.right));
  const width = Number.isFinite(maxWidth) ? Math.max(maxWidth, contentWidth) : contentWidth;
  const lastLineBottom = extents.length > 0 ? extents[extents.length - 1].bottom : 0;
  const height = Math.max(1, (lines.length - 1) * font.lineHeight + lastLineBottom);

  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let penY = 0;

  for (const line of lines) {
    let penX = 0;
    let prevId: number | null = null;

    for (const ch of line) {
      const id = ch.codePointAt(0);
      if (id === undefined) continue;
      const bmChar: BmChar | undefined = font.chars.get(id);
      if (!bmChar) {
        prevId = id;
        continue;
      }

      if (prevId !== null) {
        penX += font.kernings.get(`${prevId}_${id}`) ?? 0;
      }

      const pageImage = pageImages[bmChar.page];
      if (pageImage && bmChar.width > 0 && bmChar.height > 0) {
        ctx.drawImage(
          pageImage,
          bmChar.x,
          bmChar.y,
          bmChar.width,
          bmChar.height,
          penX + bmChar.xoffset,
          penY + bmChar.yoffset,
          bmChar.width,
          bmChar.height,
        );
      }

      penX += bmChar.xadvance;
      prevId = id;
    }

    penY += font.lineHeight;
  }
}

export function renderAtlas(ctx: CanvasRenderingContext2D, atlas: FontAtlas): void {
  const canvas = ctx.canvas;
  const { font, pageImages } = atlas;
  const chars = [...font.chars.values()].sort((a, b) => a.id - b.id);

  if (chars.length === 0) {
    canvas.width = 1;
    canvas.height = 1;
    return;
  }

  const cellWidth =
    Math.max(...chars.map((c) => c.width), 1) + ATLAS_PADDING * 2;
  const cellHeight =
    Math.max(...chars.map((c) => c.height), 1) +
    ATLAS_PADDING * 2 +
    ATLAS_LABEL_HEIGHT;

  const columns = Math.min(ATLAS_MAX_COLUMNS, chars.length);
  const rows = Math.ceil(chars.length / columns);

  canvas.width = columns * cellWidth;
  canvas.height = rows * cellHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.font = "10px monospace";
  ctx.fillStyle = "#888";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  chars.forEach((bmChar, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const cellX = col * cellWidth;
    const cellY = row * cellHeight;

    const pageImage = pageImages[bmChar.page];
    if (pageImage && bmChar.width > 0 && bmChar.height > 0) {
      ctx.drawImage(
        pageImage,
        bmChar.x,
        bmChar.y,
        bmChar.width,
        bmChar.height,
        cellX + ATLAS_PADDING,
        cellY + ATLAS_PADDING,
        bmChar.width,
        bmChar.height,
      );
    }

    ctx.fillText(
      String(bmChar.id),
      cellX + cellWidth / 2,
      cellY + cellHeight - ATLAS_LABEL_HEIGHT,
    );
  });
}
