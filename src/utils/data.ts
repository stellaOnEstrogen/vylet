import fs from 'fs';
import path from 'path';

const dataDir = path.join(__dirname, '..', '..', 'data');

export async function readDataFile(
	filename: string,
	cb?: (data: string) => any,
) {
	const filePath = path.join(dataDir, filename);

	const exists = fs.existsSync(filePath);

	if (!exists) {
		throw new Error(`File ${filename} does not exist`);
	}

	const data = fs.readFileSync(filePath, 'utf-8');

	if (cb) return cb(data);
	return data;
}

export function replaceData(content: string, data: Record<string, string>) {
	return Object.entries(data).reduce(
		(acc, [key, value]) => acc.replace(new RegExp(`{{${key}}}`, 'g'), value),
		content,
	);
}
