import { ClosePriceResult, PriceType } from '../types';

export interface PriceProvider {
	getClosePrice(params: {
		symbol: string;
		assetName: string;
		date: string;
		priceType: PriceType;
	}): Promise<ClosePriceResult | null>;
}
