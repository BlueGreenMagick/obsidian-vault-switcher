import { Plugin } from "obsidian";
import { CommandsManager } from "./commands-manager";
import { parseAndMigrateRawSettings, type RawPluginSetting } from "./migrate";
import { VaultSwitcherSettingTab, type PluginSetting } from "./settings";
import { VaultSwitcherBar } from "./ui/vault-switcher-bar";

export class VaultSwitcherPlugin extends Plugin {
  settings!: PluginSetting;
  private vaultSwitcherBar: VaultSwitcherBar | null = null;
  private commandsManager: CommandsManager | null = null;

  async onload(): Promise<void> {
    const rawSettings = ((await this.loadData()) ?? {}) as RawPluginSetting;
    this.settings = parseAndMigrateRawSettings(rawSettings);

    if (this.settings !== rawSettings) {
      await this.saveSettings();
    }

    this.commandsManager = new CommandsManager(this);
    this.commandsManager.sync(this.settings.vaults);

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
    this.commandsManager?.sync(this.settings.vaults);
    this.refreshVaultSwitcherBar();
  }
}

export default VaultSwitcherPlugin;
