import { Plugin } from "obsidian";
import {
  parseRawSettings,
  VaultSwitcherSettingTab,
  type PluginSetting,
  type RawPluginSetting,
} from "./settings";

export class VaultSwitcherPlugin extends Plugin {
  settings!: PluginSetting;

  async onload(): Promise<void> {
    this.settings = parseRawSettings((await this.loadData()) as RawPluginSetting);

    this.addSettingTab(new VaultSwitcherSettingTab(this));
  }
}

export default VaultSwitcherPlugin;
