import { App, ButtonComponent, Modal, Notice } from 'obsidian';
import { getCachedClosePrice, setCachedClosePrice } from '../cache';
import { PriceProvider } from '../providers/PriceProvider';
import { ClosePriceResult, NoteAssetInfo, PluginSettings } from '../types';

interface ClosePriceModalParams {
	app: App;
	assetInfo: NoteAssetInfo;
	initialDate: string;
	settings: PluginSettings;
	createProvider: (apiKey: string) => PriceProvider;
	saveSettings: () => Promise<void>;
}

export class ClosePriceModal extends Modal {
	private readonly assetInfo: NoteAssetInfo;
	private readonly initialDate: string;
	private readonly settings: PluginSettings;
	private readonly createProvider: (apiKey: string) => PriceProvider;
	private readonly saveSettings: () => Promise<void>;
	private apiKeyInputEl!: HTMLInputElement;
	private dateInputEl!: HTMLInputElement;
	private lookupButton!: ButtonComponent;
	private resultEl!: HTMLElement;
	private copyButton!: ButtonComponent;
	private lastResultText: string | null = null;

	constructor(params: ClosePriceModalParams) {
		super(params.app);
		this.assetInfo = params.assetInfo;
		this.initialDate = params.initialDate;
		this.settings = params.settings;
		this.createProvider = params.createProvider;
		this.saveSettings = params.saveSettings;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('krx-close-price-modal');

		contentEl.createEl('h2', { text: '특정 날짜 종가 조회' });

		const summaryEl = contentEl.createDiv({ cls: 'krx-close-price-summary' });
		this.createReadonlyRow(summaryEl, '기업명', this.assetInfo.assetName);
		this.createReadonlyRow(summaryEl, '심볼', this.assetInfo.symbol);

		const apiKeyRowEl = summaryEl.createDiv({ cls: 'krx-close-price-row' });
		apiKeyRowEl.createEl('span', {
			text: 'API key',
			cls: 'krx-close-price-label',
		});
		this.apiKeyInputEl = apiKeyRowEl.createEl('input', {
			cls: 'krx-close-price-api-key',
		});
		this.apiKeyInputEl.type = 'password';
		this.apiKeyInputEl.placeholder = 'Krx open API auth_key';
		this.apiKeyInputEl.value = this.settings.apiKey;

		const dateRowEl = summaryEl.createDiv({ cls: 'krx-close-price-row' });
		dateRowEl.createEl('span', { text: '날짜', cls: 'krx-close-price-label' });
		this.dateInputEl = dateRowEl.createEl('input', {
			cls: 'krx-close-price-date',
		});
		this.dateInputEl.type = 'date';
		this.dateInputEl.value = this.initialDate;

		const actionsEl = contentEl.createDiv({ cls: 'krx-close-price-actions' });
		this.lookupButton = new ButtonComponent(actionsEl)
			.setButtonText('조회')
			.setCta()
			.onClick(() => {
				void this.lookup();
			});

		this.copyButton = new ButtonComponent(actionsEl)
			.setButtonText('복사')
			.setDisabled(true)
			.onClick(() => {
				void this.copyLastResult();
			});

		this.resultEl = contentEl.createDiv({ cls: 'krx-close-price-result' });
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}

	private createReadonlyRow(parentEl: HTMLElement, label: string, value: string): void {
		const rowEl = parentEl.createDiv({ cls: 'krx-close-price-row' });
		rowEl.createEl('span', { text: label, cls: 'krx-close-price-label' });
		rowEl.createEl('span', { text: value, cls: 'krx-close-price-value' });
	}

	private async lookup(): Promise<void> {
		const date = this.dateInputEl.value;
		const apiKey = this.apiKeyInputEl.value.trim();

		if (!date) {
			this.showMessage('날짜를 선택해주세요.', true);
			new Notice('날짜를 선택해주세요.');
			return;
		}

		if (!apiKey) {
			this.showMessage('API key가 설정되지 않았습니다.', true);
			new Notice('API key가 설정되지 않았습니다.');
			return;
		}

		this.setLoading(true);
		this.settings.apiKey = apiKey;
		this.settings.lastSelectedDate = date;
		await this.saveSettings();

		try {
			const provider = this.createProvider(apiKey);
			const cachedResult = getCachedClosePrice(
				this.settings,
				this.assetInfo.symbol,
				date,
			);
			const result =
				cachedResult ??
				(await provider.getClosePrice({
					symbol: this.assetInfo.symbol,
					assetName: this.assetInfo.assetName,
					date,
					priceType: 'raw',
				}));

			if (!result) {
				this.showMessage('해당 날짜의 거래 데이터가 없습니다.', true);
				new Notice('해당 날짜의 거래 데이터가 없습니다.');
				return;
			}

			if (!cachedResult) {
				setCachedClosePrice(this.settings, result);
				await this.saveSettings();
			}

			this.showResult(result);
			await this.copyLastResult(true);
		} catch (error) {
			console.error(error);
			this.showMessage(formatLookupError(error), true);
			new Notice('종가 조회 중 오류가 발생했습니다.');
		} finally {
			this.setLoading(false);
		}
	}

	private showResult(result: ClosePriceResult): void {
		const text = formatClosePriceResult(result);
		this.lastResultText = text;
		this.copyButton.setDisabled(false);

		this.resultEl.empty();
		const resultLines = text.split('\n');
		for (const line of resultLines) {
			this.resultEl.createDiv({ text: line });
		}
	}

	private showMessage(message: string, isError: boolean): void {
		this.lastResultText = message;
		this.copyButton.setDisabled(false);
		this.resultEl.empty();
		this.resultEl.createDiv({
			text: message,
			cls: isError ? 'krx-close-price-error' : undefined,
		});
	}

	private async copyLastResult(isAutomatic = false): Promise<void> {
		if (!this.lastResultText) {
			return;
		}

		try {
			await navigator.clipboard.writeText(this.lastResultText);
			new Notice(
				isAutomatic
					? '종가를 조회하고 클립보드에 복사했습니다.'
					: '내용을 클립보드에 복사했습니다.',
			);
		} catch (error) {
			console.error(error);
			new Notice('종가를 조회했습니다. 복사 버튼으로 다시 복사할 수 있습니다.');
		}
	}

	private setLoading(isLoading: boolean): void {
		this.lookupButton.setDisabled(isLoading);
		this.apiKeyInputEl.disabled = isLoading;
		this.dateInputEl.disabled = isLoading;
		this.lookupButton.setButtonText(isLoading ? '조회 중...' : '조회');
	}
}

function formatLookupError(error: unknown): string {
	if (error instanceof Error && error.message) {
		return `종가 조회 중 오류가 발생했습니다.\n${error.message}`;
	}

	return '종가 조회 중 오류가 발생했습니다.';
}

export function formatClosePriceResult(result: ClosePriceResult): string {
	const closePrice = `${result.closeRaw.toLocaleString()}원`;
	const dateLine =
		result.requestedDate === result.actualTradeDate
			? `${result.requestedDate} 종가: ${closePrice}`
			: [
					`선택 날짜: ${result.requestedDate}`,
					`실제 거래일: ${result.actualTradeDate}`,
					`종가: ${closePrice}`,
				].join('\n');

	return [
		`${result.assetName} (${result.symbol})`,
		dateLine,
		'데이터 기준: 원주가',
		`출처: ${result.source}`,
	].join('\n');
}
