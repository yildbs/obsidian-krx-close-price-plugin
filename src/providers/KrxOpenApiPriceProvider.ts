import { requestUrl } from 'obsidian';
import { PriceProvider } from './PriceProvider';
import { ClosePriceResult } from '../types';

interface KrxDailyTradeRow {
	BAS_DD?: string;
	ISU_CD?: string;
	ISU_NM?: string;
	MKT_NM?: string;
	TDD_CLSPRC?: string;
	MKTCAP?: string;
}

interface KrxDailyTradeResponse {
	OutBlock_1?: KrxDailyTradeRow[];
	ErrorCode?: string;
	ErrorMsg?: string;
	errorCode?: string;
	errorMsg?: string;
}

interface KrxMarketApi {
	id: string;
	name: string;
}

const MARKET_APIS: KrxMarketApi[] = [
	{ id: 'stk_bydd_trd', name: 'KOSPI' },
	{ id: 'ksq_bydd_trd', name: 'KOSDAQ' },
	{ id: 'knx_bydd_trd', name: 'KONEX' },
];

export class KrxOpenApiPriceProvider implements PriceProvider {
	private readonly apiBaseUrl: string;
	private readonly apiKey: string;

	constructor(params: { apiBaseUrl: string; apiKey: string }) {
		this.apiBaseUrl = params.apiBaseUrl.replace(/\/+$/, '');
		this.apiKey = params.apiKey;
	}

	async getClosePrice(params: {
		symbol: string;
		assetName: string;
		date: string;
		priceType: 'raw';
	}): Promise<ClosePriceResult | null> {
		const basDd = params.date.replaceAll('-', '');

		for (const marketApi of MARKET_APIS) {
			const row = await this.fetchMarketRow(marketApi, basDd, params.symbol);

			if (row) {
				const closeRaw = parseKrxNumber(row.TDD_CLSPRC);
				const marketCapRaw = parseKrxNumber(row.MKTCAP);

				if (closeRaw === null) {
					throw new Error('KRX 응답에서 종가를 읽을 수 없습니다.');
				}

				if (marketCapRaw === null) {
					throw new Error('KRX 응답에서 시가총액을 읽을 수 없습니다.');
				}

				return {
					symbol: params.symbol,
					assetName: params.assetName,
					requestedDate: params.date,
					actualTradeDate: formatKrxDate(row.BAS_DD ?? basDd),
					closeRaw,
					marketCapRaw,
					priceType: params.priceType,
					source: 'KRX',
					fetchedAt: new Date().toISOString(),
				};
			}
		}

		return null;
	}

	private async fetchMarketRow(
		marketApi: KrxMarketApi,
		basDd: string,
		symbol: string,
	): Promise<KrxDailyTradeRow | null> {
		const url = `${this.apiBaseUrl}/sto/${marketApi.id}?basDd=${encodeURIComponent(basDd)}`;
		const response = await requestUrl({
			url,
			method: 'GET',
			headers: {
				AUTH_KEY: this.apiKey,
			},
			throw: false,
		});

		if (response.status < 200 || response.status >= 300) {
			throw new Error(
				[
					`KRX ${marketApi.name} API 요청 실패: HTTP ${response.status}`,
					trimResponseText(response.text),
				]
					.filter(Boolean)
					.join('\n'),
			);
		}

		const data = parseKrxResponse(response.text, marketApi.name);
		const apiError = getKrxApiError(data);

		if (apiError) {
			throw new Error(`KRX ${marketApi.name} API 오류: ${apiError}`);
		}

		const rows = Array.isArray(data.OutBlock_1) ? data.OutBlock_1 : [];

		return rows.find((row) => row.ISU_CD === symbol) ?? null;
	}
}

function parseKrxResponse(responseText: string, marketName: string): KrxDailyTradeResponse {
	try {
		return JSON.parse(responseText) as KrxDailyTradeResponse;
	} catch {
		throw new Error(
			[
				`KRX ${marketName} API 응답을 JSON으로 읽을 수 없습니다.`,
				trimResponseText(responseText),
			]
				.filter(Boolean)
				.join('\n'),
		);
	}
}

function getKrxApiError(data: KrxDailyTradeResponse): string | null {
	const errorCode = data.ErrorCode ?? data.errorCode;
	const errorMsg = data.ErrorMsg ?? data.errorMsg;

	if (!errorCode && !errorMsg) {
		return null;
	}

	return [errorCode, errorMsg].filter(Boolean).join(' ');
}

function trimResponseText(responseText: string): string {
	const normalized = responseText.replace(/\s+/g, ' ').trim();

	if (!normalized) {
		return '';
	}

	return normalized.length > 240
		? `${normalized.slice(0, 240)}...`
		: normalized;
}

function parseKrxNumber(value: string | undefined): number | null {
	if (!value) {
		return null;
	}

	const normalized = value.replaceAll(',', '').trim();
	const parsed = Number(normalized);

	return Number.isFinite(parsed) ? parsed : null;
}

function formatKrxDate(value: string): string {
	if (/^\d{8}$/.test(value)) {
		return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
	}

	return value;
}
