import { App, MarkdownView, TFile } from 'obsidian';
import { NoteAssetInfo } from './types';

export const MISSING_FRONTMATTER_MESSAGE = [
	'현재 노트의 frontmatter에 asset_name과 symbol을 입력해주세요.',
	'',
	'예시:',
	'asset_name: 휴메딕스',
	'symbol: "200670"',
].join('\n');

export function getActiveMarkdownFile(app: App): TFile | null {
	const activeView = app.workspace.getActiveViewOfType(MarkdownView);
	const file = activeView?.file ?? app.workspace.getActiveFile();

	if (!file || file.extension !== 'md') {
		return null;
	}

	return file;
}

export function readNoteAssetInfo(app: App, file: TFile): NoteAssetInfo | string {
	const assetName = normalizeAssetName(getFrontmatterValue(app, file, 'asset_name'));
	const symbol = normalizeSymbol(getFrontmatterValue(app, file, 'symbol'));

	if (!assetName && !symbol) {
		return MISSING_FRONTMATTER_MESSAGE;
	}

	if (!assetName) {
		return '현재 노트에서 asset_name을 찾을 수 없습니다.';
	}

	if (!symbol) {
		return '현재 노트에서 symbol을 찾을 수 없습니다.';
	}

	return {
		assetName,
		symbol,
	};
}

export function readPreferredDate(app: App, file: TFile): string | null {
	return normalizeDate(getFrontmatterValue(app, file, 'date'));
}

export function normalizeSymbol(value: unknown): string | null {
	const normalizedValue = normalizePrimitiveString(value);

	if (normalizedValue === null) {
		return null;
	}

	const symbol = normalizedValue.trim().toUpperCase();

	if (!symbol) {
		return null;
	}

	if (/^A\d{6}$/.test(symbol)) {
		return symbol.slice(1);
	}

	if (/^\d{1,6}$/.test(symbol)) {
		return symbol.padStart(6, '0');
	}

	return symbol;
}

export function normalizeDate(value: unknown): string | null {
	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		return toLocalDateInputValue(value);
	}

	const normalizedValue = normalizePrimitiveString(value);

	if (normalizedValue === null) {
		return null;
	}

	const text = normalizedValue.trim();

	if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
		return text;
	}

	if (/^\d{8}$/.test(text)) {
		return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
	}

	return null;
}

export function toLocalDateInputValue(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');

	return `${year}-${month}-${day}`;
}

function normalizeAssetName(value: unknown): string | null {
	const normalizedValue = normalizePrimitiveString(value);

	if (normalizedValue === null) {
		return null;
	}

	const assetName = normalizedValue.trim();
	return assetName || null;
}

function getFrontmatterValue(app: App, file: TFile, key: string): unknown {
	const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;

	return frontmatter?.[key];
}

function normalizePrimitiveString(value: unknown): string | null {
	if (
		typeof value === 'string' ||
		typeof value === 'number' ||
		typeof value === 'boolean'
	) {
		return String(value);
	}

	return null;
}
