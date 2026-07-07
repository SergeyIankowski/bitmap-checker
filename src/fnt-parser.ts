export interface BmChar {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  xoffset: number;
  yoffset: number;
  xadvance: number;
  page: number;
}

export interface BmPage {
  id: number;
  file: string;
}

export interface BmFont {
  lineHeight: number;
  base: number;
  scaleW: number;
  scaleH: number;
  pages: BmPage[];
  chars: Map<number, BmChar>;
  kernings: Map<string, number>;
}

function parseAttributes(rest: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRegex = /(\w+)=("[^"]*"|\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(rest)) !== null) {
    const [, key, rawValue] = match;
    attrs[key] = rawValue.startsWith('"') ? rawValue.slice(1, -1) : rawValue;
  }
  return attrs;
}

export function parseFnt(text: string): BmFont {
  const font: BmFont = {
    lineHeight: 0,
    base: 0,
    scaleW: 0,
    scaleH: 0,
    pages: [],
    chars: new Map(),
    kernings: new Map(),
  };

  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const spaceIndex = trimmed.indexOf(" ");
    const tag = spaceIndex === -1 ? trimmed : trimmed.slice(0, spaceIndex);
    const rest = spaceIndex === -1 ? "" : trimmed.slice(spaceIndex + 1);
    const attrs = parseAttributes(rest);

    switch (tag) {
      case "common":
        font.lineHeight = Number(attrs.lineHeight ?? 0);
        font.base = Number(attrs.base ?? 0);
        font.scaleW = Number(attrs.scaleW ?? 0);
        font.scaleH = Number(attrs.scaleH ?? 0);
        break;
      case "page":
        font.pages.push({ id: Number(attrs.id ?? 0), file: attrs.file ?? "" });
        break;
      case "char": {
        const char: BmChar = {
          id: Number(attrs.id ?? 0),
          x: Number(attrs.x ?? 0),
          y: Number(attrs.y ?? 0),
          width: Number(attrs.width ?? 0),
          height: Number(attrs.height ?? 0),
          xoffset: Number(attrs.xoffset ?? 0),
          yoffset: Number(attrs.yoffset ?? 0),
          xadvance: Number(attrs.xadvance ?? 0),
          page: Number(attrs.page ?? 0),
        };
        font.chars.set(char.id, char);
        break;
      }
      case "kerning": {
        const first = Number(attrs.first ?? 0);
        const second = Number(attrs.second ?? 0);
        const amount = Number(attrs.amount ?? 0);
        font.kernings.set(`${first}_${second}`, amount);
        break;
      }
      default:
        break;
    }
  }

  return font;
}
