import { setIcon } from "obsidian";
import type VaultSwitcherPlugin from "../main";

export class VaultSwitcherBar {
  private readonly rootEl: HTMLElement;

  constructor(
    private readonly plugin: VaultSwitcherPlugin,
    private readonly containerEl: HTMLElement,
  ) {
    this.rootEl = containerEl.createDiv({ cls: "vault-switcher-bar" });
  }

  render(): void {
    this.rootEl.empty();

    for (const vault of this.plugin.settings.vaults) {
      const button = this.rootEl.createEl("button", {
        cls: ["vault-switcher-bar__button", "vault-switcher-bar__vault"],
        attr: {
          type: "button",
          "aria-label": vault.vaultName,
          title: vault.vaultName,
        },
      });
      button.textContent = vault.icon.text;
      button.style.backgroundColor = vault.icon.backgroundColor;
      button.addEventListener("click", () => {
        window.open(`obsidian://open?vault=${encodeURIComponent(vault.vaultName)}`);
      });
    }

    const settingsButton = this.rootEl.createEl("button", {
      cls: ["vault-switcher-bar__button", "vault-switcher-bar__settings"],
      attr: {
        type: "button",
        "aria-label": "Open vault switcher settings",
        title: "Open vault switcher settings",
      },
    });
    setIcon(settingsButton, "settings");
  }

  destroy(): void {
    this.rootEl.remove();
  }

  isMountedIn(containerEl: HTMLElement): boolean {
    return this.containerEl === containerEl;
  }
}
