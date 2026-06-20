import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import KrxClosePricePlugin from './main';
import { PluginSettings } from './types';

export const DEFAULT_API_BASE_URL = 'https://data-dbg.krx.co.kr/svc/apis';
export const LEGACY_API_BASE_URL = 'https://data.krx.co.kr/svc/apis';

export const DEFAULT_SETTINGS: PluginSettings = {
	priceProvider: 'krx',
	apiKey: '',
	apiBaseUrl: DEFAULT_API_BASE_URL,
	cache: {},
};

export class KrxClosePriceSettingTab extends PluginSettingTab {
	plugin: KrxClosePricePlugin;

	constructor(app: App, plugin: KrxClosePricePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl).setName('Krx 가격 조회 설정').setHeading();

		new Setting(containerEl)
			.setName('가격 데이터 제공자')
			.setDesc('Krx open API를 사용합니다.')
			.addText((text) => {
				text.setValue('KRX').setDisabled(true);
			});

		new Setting(containerEl)
			.setName('캐시 비우기')
			.setDesc('저장된 가격 조회 캐시를 모두 삭제합니다.')
			.addButton((button) =>
				button.setButtonText('캐시 비우기').onClick(async () => {
					this.plugin.settings.cache = {};
					await this.plugin.saveSettings();
					new Notice('가격 조회 캐시를 비웠습니다.');
					this.display();
				}),
			);

		const cacheCount = Object.keys(this.plugin.settings.cache).length;
		containerEl.createEl('p', {
			text: `현재 캐시 항목: ${cacheCount.toLocaleString()}개`,
			cls: 'krx-close-price-cache-count',
		});
	}
}
