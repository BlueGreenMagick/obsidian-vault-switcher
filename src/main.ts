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
  private readonly vaultSwitcherBars = new Set<VaultSwitcherBar>();

  async onload(): Promise<void> {
    this.settings = parseRawSettings((await this.loadData()) as RawPluginSetting);

    this.addSettingTab(new VaultSwitcherSettingTab(this));

    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        this.reconcileVaultSwitcherBars();
      }),
    );
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        this.reconcileVaultSwitcherBars();
      }),
    );
    this.app.workspace.onLayoutReady(() => {
      this.reconcileVaultSwitcherBars();
    });
  }

  onunload(): void {
    for (const bar of this.vaultSwitcherBars) {
      bar.destroy();
    }
    this.vaultSwitcherBars.clear();
  }

  refreshVaultSwitcherBars(): void {
    for (const bar of this.vaultSwitcherBars) {
      bar.render();
    }
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.refreshVaultSwitcherBars();
  }

  private reconcileVaultSwitcherBars(): void {
    const activeBars = new Set<VaultSwitcherBar>();

    for (const leaf of this.app.workspace.getLeavesOfType("file-explorer")) {
      if (leaf.isDeferred) {
        continue;
      }

      const containerEl = leaf.view.containerEl;
      const existingBar = [...this.vaultSwitcherBars].find((bar) => bar.isMountedIn(containerEl));

      if (existingBar !== undefined) {
        activeBars.add(existingBar);
        continue;
      }

      const bar = new VaultSwitcherBar(this, containerEl);
      bar.render();
      this.vaultSwitcherBars.add(bar);
      activeBars.add(bar);
    }

    for (const bar of this.vaultSwitcherBars) {
      if (activeBars.has(bar)) {
        continue;
      }

      bar.destroy();
      this.vaultSwitcherBars.delete(bar);
    }
  }
}

export default VaultSwitcherPlugin;
