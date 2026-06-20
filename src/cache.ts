import { ClosePriceResult, PluginSettings } from './types';

export function getCacheKey(symbol: string, date: string): string {
	return `${symbol}:${date}:raw`;
}

export function getCachedClosePrice(
	settings: PluginSettings,
	symbol: string,
	date: string,
): ClosePriceResult | null {
	const result = settings.cache[getCacheKey(symbol, date)];

	if (!result || !Number.isFinite(result.marketCapRaw)) {
		return null;
	}

	return result;
}

export function setCachedClosePrice(
	settings: PluginSettings,
	result: ClosePriceResult,
): void {
	settings.cache[getCacheKey(result.symbol, result.requestedDate)] = result;
}
