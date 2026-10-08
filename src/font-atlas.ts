import { readAsDataURL, readAsText } from "./file-loader";
import { type BmFont, parseFnt } from "./fnt-parser";

export interface FontAtlas {
	font: BmFont;
	pageImages: HTMLImageElement[];
}

function stripExtension(name: string): string {
	return name.toLowerCase().replace(/\.[^./\\]+$/, "");
}

// Exact name match first; otherwise fall back to the same base name with a
// different extension (e.g. "font_0.png" in .fnt, "font_0.webp" on disk).
function findPageImage(imageFiles: File[], pageFile: string): File | undefined {
	const target = pageFile.toLowerCase();
	const exact = imageFiles.find((f) => f.name.toLowerCase() === target);
	if (exact) return exact;
	const base = stripExtension(target);
	return imageFiles.find((f) => stripExtension(f.name) === base);
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error("Failed to load image"));
		img.src = dataUrl;
	});
}

export async function loadFontAtlas(
	fntFile: File,
	imageFiles: File[],
): Promise<FontAtlas> {
	const fntText = await readAsText(fntFile);
	const font = parseFnt(fntText);

	if (font.pages.length === 0) {
		throw new Error("No pages found in .fnt file");
	}

	const pageImages: HTMLImageElement[] = [];
	for (const page of font.pages) {
		const imageFile = findPageImage(imageFiles, page.file);
		if (!imageFile) {
			throw new Error(
				`Missing texture "${page.file}" required by the font (page ${page.id})`,
			);
		}
		const dataUrl = await readAsDataURL(imageFile);
		pageImages[page.id] = await loadImage(dataUrl);
	}

	return { font, pageImages };
}
