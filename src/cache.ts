import { ClosePriceResult, PluginSettings } from './types';

export function getCacheKey(symbol: string, date: string): string {
	return `${symbol}:${date}:raw`;
}

export function getCachedClosePrice(
	settings: PluginSettings,
	symbol: string,
	date: string,
): ClosePriceResult | null {
	return settings.cache[getCacheKey(symbol, date)] ?? null;
}

export function setCachedClosePrice(
	settings: PluginSettings,
	result: ClosePriceResult,
): void {
	settings.cache[getCacheKey(result.symbol, result.requestedDate)] = result;
}
