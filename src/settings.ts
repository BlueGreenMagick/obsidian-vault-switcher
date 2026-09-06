import * as Obsidian from "obsidian";
import type VaultSwitcherPlugin from "./main";
import {
  ExportConfigurationModal,
  ImportConfigurationModal,
} from "./ui/configuration-transfer-modal";
import { renderVaultIcon } from "./ui/vault-icon";

// Increment when the same setting key is re-used to store different type of setting
export const SETTINGS_VERSION = 2 as const;

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
  type: "simple" | "custom";
  text?: string;
  backgroundColor?: string;
  imageDataUrl?: string;
}

/** Fallback values used when a `VaultIconSetting` field is empty */
export const DEFAULT_VAULT_ICON_SETTING = {
  type: "simple",
  text: "",
  backgroundColor: "#808080",
  imageDataUrl: "",
} satisfies Required<VaultIconSetting>;

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
    vaults: (raw.vaults ?? []).map((vault) => ({
      ...vault,
      icon: {
        ...vault.icon,
        type: vault.icon.type ?? DEFAULT_VAULT_ICON_SETTING.type,
        text: vault.icon.text ?? DEFAULT_VAULT_ICON_SETTING.text,
        backgroundColor:
          vault.icon.backgroundColor ??
          DEFAULT_VAULT_ICON_SETTING.backgroundColor,
        imageDataUrl:
          vault.icon.imageDataUrl ?? DEFAULT_VAULT_ICON_SETTING.imageDataUrl,
      },
    })),
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
        name: "Configuration",
        desc: "Copy or paste the entire configuration between vaults.",
        render: (setting) => {
          setting.addButton((button) =>
            button.setButtonText("Import").onClick(() => {
              new ImportConfigurationModal(this.app, async (raw) => {
                await this.importConfiguration(raw);
              }).open();
            }),
          );
          setting.addButton((button) =>
            button.setButtonText("Export").onClick(() => {
              new ExportConfigurationModal(
                this.app,
                JSON.stringify(this.settings, null, 2),
              ).open();
            }),
          );
        },
      },
      {
        type: "list",
        heading: "Vaults",
        emptyState: "No vaults configured.",
        addItem: {
          name: "Add vault",
          action: () => {
            this.settings.vaults.push({
              vaultName: "",
              icon: { ...DEFAULT_VAULT_ICON_SETTING },
            });
            this.saveSetting();
            this.update();
          },
        },
        items: this.settings.vaults.map((vaultSetting) => ({
          name: vaultSetting.vaultName,
          render: (setting) => this.renderVaultSettings(setting, vaultSetting),
        })),
        onReorder: (oldIndex, newIndex) => {
          const [moved] = this.settings.vaults.splice(oldIndex, 1);
          if (moved === undefined) {
            return;
          }
          this.settings.vaults.splice(newIndex, 0, moved);
          this.saveSetting();
        },
        onDelete: (idx) => {
          this.settings.vaults.splice(idx, 1);
          this.saveSetting();
          this.update();
        },
      },
    ];
  }

  renderVaultSettings(setting: Obsidian.Setting, vaultSetting: VaultSetting) {
    setting.settingEl.addClass("vault-switcher-settings__vault");
    setting.nameEl.empty();
    setting.infoEl
      .querySelectorAll(":scope > .vault-switcher-settings__icon-preview")
      .forEach((element) => element.remove());
    setting.nameEl.addClass("vault-switcher-settings__vault-header");

    const previewEl = setting.nameEl.createDiv({
      cls: "vault-switcher-settings__icon-preview",
      attr: {
        "aria-label": "Icon preview",
        title: "Icon preview",
      },
    });
    renderVaultIcon(previewEl, vaultSetting.icon);

    const vaultName = new Obsidian.TextComponent(setting.nameEl);
    vaultName.setValue(vaultSetting.vaultName);
    vaultName.setPlaceholder("Vault name");
    vaultName.onChange((value) => {
      vaultSetting.vaultName = value;
      this.saveSetting();
    });

    const dropdown = new Obsidian.DropdownComponent(setting.nameEl);
    dropdown.addOption("simple", "Simple");
    dropdown.addOption("custom", "Custom");
    dropdown.setValue(vaultSetting.icon.type);
    dropdown.onChange((value) => {
      vaultSetting.icon.type = value === "custom" ? "custom" : "simple";
      this.saveSetting();
      this.update();
    });

    if (vaultSetting.icon.type === "simple") {
      const text = new Obsidian.TextComponent(setting.controlEl);
      text.setValue(vaultSetting.icon.text ?? DEFAULT_VAULT_ICON_SETTING.text);
      text.setPlaceholder("Icon text");
      text.inputEl.addClass("vault-switcher-settings__icon-text");
      text.onChange((value) => {
        vaultSetting.icon.text = value;
        renderVaultIcon(previewEl, vaultSetting.icon);
        this.saveSetting();
      });

      const picker = new Obsidian.ColorComponent(setting.controlEl);
      picker.setValue(
        vaultSetting.icon.backgroundColor ??
          DEFAULT_VAULT_ICON_SETTING.backgroundColor,
      );
      picker.onChange((color) => {
        vaultSetting.icon.backgroundColor = color;
        renderVaultIcon(previewEl, vaultSetting.icon);
        this.saveSetting();
      });
      return;
    }

    const fileButton = setting.controlEl.createEl("label", {
      cls: "vault-switcher-settings__file-button",
      text: vaultSetting.icon.imageDataUrl ? "Replace File" : "Select File",
    });
    const input = fileButton.createEl("input", {
      cls: "vault-switcher-settings__file-input",
      attr: { type: "file", accept: "image/*" },
    });
    input.addEventListener(
      "change",
      () => this.onImageSelected(input, vaultSetting),
      {
        once: true,
      },
    );

    if (vaultSetting.icon.imageDataUrl !== "") {
      const removeButton = new Obsidian.ExtraButtonComponent(setting.controlEl);
      removeButton.setIcon("trash-2");
      removeButton.setTooltip("Remove custom icon");
      removeButton.onClick(() => {
        vaultSetting.icon.imageDataUrl = "";
        this.saveSetting();
        this.update();
      });
    }
  }

  private onImageSelected(
    input: HTMLInputElement,
    vaultSetting: VaultSetting,
  ): void {
    const file = input.files?.[0];
    if (file === undefined) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      new Obsidian.Notice("Select an image file.");
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result !== "string") {
        new Obsidian.Notice("Could not read the selected image.");
        return;
      }

      vaultSetting.icon.imageDataUrl = reader.result;
      this.saveSetting();
      this.update();
    });
    reader.addEventListener("error", () => {
      new Obsidian.Notice("Could not read the selected image.");
    });
    reader.readAsDataURL(file);
  }

  private async importConfiguration(raw: unknown): Promise<void> {
    if (
      typeof raw !== "object" ||
      raw === null ||
      !("settingVersion" in raw) ||
      typeof raw.settingVersion !== "number"
    ) {
      throw new Error(
        "Not a valid configuration: settingVersion field does not exist",
      );
    }

    const importedSettings = parseRawSettings(raw as RawPluginSetting);
    const previousSettings = this.plugin.settings;

    this.settings = importedSettings;
    this.plugin.settings = importedSettings;

    try {
      await this.plugin.saveSettings();
    } catch (error) {
      this.settings = previousSettings;
      this.plugin.settings = previousSettings;
      throw error;
    }

    this.update();
  }

  saveSetting() {
    this.plugin.settings = this.settings;
    void this.plugin.saveSettings();
  }
}
