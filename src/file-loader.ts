export interface CategorizedFiles {
	fntFile?: File;
	imageFiles: File[];
}

export function categorizeFiles(files: File[]): CategorizedFiles {
	const result: CategorizedFiles = { imageFiles: [] };

	for (const file of files) {
		const name = file.name.toLowerCase();
		if (name.endsWith(".fnt")) {
			result.fntFile = file;
		} else if (/\.(png|jpg|jpeg|webp)$/.test(name)) {
			result.imageFiles.push(file);
		}
	}

	return result;
}

export function readAsText(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(reader.error);
		reader.readAsText(file);
	});
}

export function readAsDataURL(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});
}
