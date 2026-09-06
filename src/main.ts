import { Plugin } from "obsidian";
import {
  parseRawSettings,
  VaultSwitcherSettingTab,
  type PluginSetting,
  type RawPluginSetting,
} from "./settings";
import { VaultSwitcherBar } from "./ui/vault-switcher-bar";

export class VaultSwitcherPlugin extends Plugin {
  settings!: PluginSetting;
  private vaultSwitcherBar: VaultSwitcherBar | null = null;

  async onload(): Promise<void> {
    this.settings = parseRawSettings((await this.loadData()) as RawPluginSetting);

    this.addSettingTab(new VaultSwitcherSettingTab(this));

    this.app.workspace.onLayoutReady(() => {
      this.vaultSwitcherBar = VaultSwitcherBar.mount(
        this,
        this.app.workspace.containerEl.ownerDocument,
      );
    });
  }

  onunload(): void {
    this.vaultSwitcherBar?.destroy();
    this.vaultSwitcherBar = null;
  }

  refreshVaultSwitcherBar(): void {
    this.vaultSwitcherBar?.render();
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.refreshVaultSwitcherBar();
  }
}

export default VaultSwitcherPlugin;
