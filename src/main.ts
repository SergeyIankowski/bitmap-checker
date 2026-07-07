import "./style.css";
import { categorizeFiles } from "./file-loader";
import { type FontAtlas, loadFontAtlas } from "./font-atlas";
import { renderAtlas, renderText } from "./renderer";

const dropzone = document.querySelector<HTMLDivElement>("#dropzone")!;
const fileInput = document.querySelector<HTMLInputElement>("#file-input")!;
const errorEl = document.querySelector<HTMLDivElement>("#error")!;
const textInput = document.querySelector<HTMLTextAreaElement>("#text-input")!;
const textCanvas = document.querySelector<HTMLCanvasElement>("#text-canvas")!;
const textCanvasWrap = textCanvas.parentElement!;
const atlasCanvas = document.querySelector<HTMLCanvasElement>("#atlas-canvas")!;

const textCtx = textCanvas.getContext("2d")!;
const atlasCtx = atlasCanvas.getContext("2d")!;

let currentAtlas: FontAtlas | null = null;

function showError(message: string | null): void {
	if (!message) {
		errorEl.hidden = true;
		errorEl.textContent = "";
		return;
	}
	errorEl.hidden = false;
	errorEl.textContent = message;
}

function redrawText(explicitWidth?: number): void {
	if (!currentAtlas) return;
	let maxWidth = explicitWidth;
	if (maxWidth === undefined) {
		const wrapStyle = getComputedStyle(textCanvasWrap);
		const paddingX =
			parseFloat(wrapStyle.paddingLeft) + parseFloat(wrapStyle.paddingRight);
		maxWidth = textCanvasWrap.clientWidth - paddingX;
	}
	renderText(textCtx, currentAtlas, textInput.value, maxWidth);
}

function applyDefaultHeight(atlas: FontAtlas): void {
	const firstPageImage = atlas.pageImages.find((img) => img);
	if (!firstPageImage) return;
	const height = `${firstPageImage.naturalHeight}px`;
	textInput.style.height = height;
	textCanvasWrap.style.height = height;
}

async function handleFiles(files: File[]): Promise<void> {
	const { fntFile, imageFiles } = categorizeFiles(files);

	if (!fntFile) {
		showError("Please provide a .fnt file.");
		return;
	}

	try {
		const atlas = await loadFontAtlas(fntFile, imageFiles);
		currentAtlas = atlas;
		showError(null);
		applyDefaultHeight(atlas);
		redrawText();
		renderAtlas(atlasCtx, atlas);
	} catch (err) {
		showError(err instanceof Error ? err.message : String(err));
	}
}

dropzone.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
	if (fileInput.files) {
		void handleFiles([...fileInput.files]);
	}
	fileInput.value = "";
});

dropzone.addEventListener("dragover", (e) => {
	e.preventDefault();
	dropzone.classList.add("dragover");
});

dropzone.addEventListener("dragleave", () => {
	dropzone.classList.remove("dragover");
});

dropzone.addEventListener("drop", (e) => {
	e.preventDefault();
	dropzone.classList.remove("dragover");
	if (e.dataTransfer?.files) {
		void handleFiles([...e.dataTransfer.files]);
	}
});

textInput.addEventListener("input", () => redrawText());

new ResizeObserver((entries) => {
	const contentBoxSize = entries[0].contentBoxSize[0];
	redrawText(contentBoxSize.inlineSize);
}).observe(textCanvasWrap);
