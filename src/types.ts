export type PriceType = 'raw';

export type PriceProviderId = 'krx';

export interface ClosePriceResult {
	symbol: string;
	assetName: string;
	requestedDate: string;
	actualTradeDate: string;
	closeRaw: number;
	priceType: PriceType;
	source: string;
	fetchedAt: string;
}

export interface PluginSettings {
	priceProvider: PriceProviderId;
	apiKey: string;
	apiBaseUrl: string;
	cache: Record<string, ClosePriceResult>;
	lastSelectedDate?: string;
}

export interface NoteAssetInfo {
	assetName: string;
	symbol: string;
}
