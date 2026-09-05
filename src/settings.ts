import * as Obsidian from "obsidian";
import type VaultSwitcherPlugin from "./main";

// Increment when the same setting key is re-used to store different type of setting
export const SETTINGS_VERSION = 1 as const;

export interface PluginSetting {
  settingVersion: number;
  /** the key must be identical to vaults[vaultName].vaultName */
  vaults: VaultSetting[];
}

export interface VaultSetting {
  vaultName: string;
  icon: VaultIconSetting;
}

export interface VaultIconSetting {
  type: "simple";
  text: string;
  backgroundColor: string;
}

/** May be a settings JSON object from any version of this plugin  */
export type RawPluginSetting = Partial<PluginSetting>;

/**
 * Try to parse raw settings json object into valid settings object.
 *
 * Raw setting text is assumed to be a valid setting from some plugin version.
 * It may do a little bit of validation if needed.
 */
export function parseRawSettings(raw: RawPluginSetting): PluginSetting {
  const rawSettingVersion = raw.settingVersion ?? 0;
  if (rawSettingVersion > SETTINGS_VERSION) {
    throw new Error(
      `Invalid setting: current setting file was created from incompatible future version of this plugin. Current setting version: "${SETTINGS_VERSION}", found: "${rawSettingVersion}"`,
    );
  }

  return {
    ...raw,
    settingVersion: SETTINGS_VERSION,
    vaults: raw.vaults ?? [],
  };
}

export class VaultSwitcherSettingTab extends Obsidian.PluginSettingTab {
  plugin: VaultSwitcherPlugin;
  /** Kept separate from plugin.settings so it can temporarily hold invalid setting state */
  settings: PluginSetting;

  constructor(plugin: VaultSwitcherPlugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
    this.icon = "lucide-panels-top-left";
    this.settings = this.plugin.settings;
  }

  getSettingDefinitions(): Obsidian.SettingDefinitionItem[] {
    return [
      {
        type: "list",
        heading: "Vaults",
        emptyState: "Found no vaults. This is a bug.",
        items: this.settings.vaults.map((vaultSetting) => ({
          name: vaultSetting.vaultName,
          render: (setting) => this.renderVaultSettings(setting, vaultSetting),
        })),
        onReorder: async (oldIndex, newIndex) => {
          const [moved] = this.settings.vaults.splice(oldIndex, 1);
          if (moved === undefined) {
            return;
          }
          this.settings.vaults.splice(newIndex, 0, moved);
          await this.saveSetting();
        },
        onDelete: async (idx) => {
          this.settings.vaults.splice(idx, 1);
          await this.saveSetting();
          this.update();
        },
      },
    ];
  }

  renderVaultSettings(setting: Obsidian.Setting, vaultSetting: VaultSetting) {
    setting.setName(vaultSetting.vaultName);
    setting.addText((text) => {
      text.setValue(vaultSetting.icon.text);
      text.onChange((value) => {
        vaultSetting.icon.text = value;
        this.saveSetting();
      });
    });
    setting.addColorPicker((picker) => {
      picker.setValue(vaultSetting.icon.backgroundColor);
      picker.onChange((color) => {
        vaultSetting.icon.backgroundColor = color;
        this.saveSetting();
      });
    });
  }

  saveSetting() {
    this.plugin.settings = this.settings;
    void this.plugin.saveSettings();
  }
}
