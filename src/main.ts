import { Notice, Plugin } from 'obsidian';
import {
	getActiveMarkdownFile,
	readNoteAssetInfo,
	readPreferredDate,
	toLocalDateInputValue,
} from './frontmatter';
import { KrxOpenApiPriceProvider } from './providers/KrxOpenApiPriceProvider';
import {
	DEFAULT_API_BASE_URL,
	DEFAULT_SETTINGS,
	KrxClosePriceSettingTab,
	LEGACY_API_BASE_URL,
} from './settings';
import { ClosePriceModal } from './ui/ClosePriceModal';
import { PluginSettings } from './types';

export default class KrxClosePricePlugin extends Plugin {
	settings!: PluginSettings;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.addRibbonIcon('chart-line', '특정 날짜 종가 조회', () => {
			this.openClosePriceModal();
		});

		this.addCommand({
			id: 'open-close-price-lookup',
			name: '특정 날짜 종가 조회',
			callback: () => {
				this.openClosePriceModal();
			},
		});

		this.addSettingTab(new KrxClosePriceSettingTab(this.app, this));
	}

	async loadSettings(): Promise<void> {
		const loadedSettings = (await this.loadData()) as Partial<PluginSettings> | null;
		this.settings = {
			...DEFAULT_SETTINGS,
			...loadedSettings,
			cache: loadedSettings?.cache ?? {},
		};

		if (
			!this.settings.apiBaseUrl ||
			this.settings.apiBaseUrl === LEGACY_API_BASE_URL
		) {
			this.settings.apiBaseUrl = DEFAULT_API_BASE_URL;
		}
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	private openClosePriceModal(): void {
		const file = getActiveMarkdownFile(this.app);

		if (!file) {
			new Notice('현재 활성 노트가 Markdown 파일이 아닙니다.');
			return;
		}

		const assetInfo = readNoteAssetInfo(this.app, file);

		if (typeof assetInfo === 'string') {
			new Notice(assetInfo, 8000);
			return;
		}

		const initialDate =
			this.settings.lastSelectedDate ??
			readPreferredDate(this.app, file) ??
			toLocalDateInputValue(new Date());

		new ClosePriceModal({
			app: this.app,
			assetInfo,
			initialDate,
			settings: this.settings,
			createProvider: (apiKey) =>
				new KrxOpenApiPriceProvider({
					apiBaseUrl: this.settings.apiBaseUrl,
					apiKey,
				}),
			saveSettings: () => this.saveSettings(),
		}).open();
	}
}
