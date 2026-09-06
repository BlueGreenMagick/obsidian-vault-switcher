import { Notice, setIcon } from "obsidian";
import type VaultSwitcherPlugin from "../main";
import { renderVaultIcon } from "./vault-icon";

const DESKTOP_HOST_SELECTOR = ".workspace-split.mod-left-split > .workspace-sidedock-vault-profile";
const MOBILE_HOST_SELECTOR =
  ".workspace-drawer.mod-left > .workspace-drawer-inner > .workspace-drawer-header";

export class VaultSwitcherBar {
  private readonly rootEl: HTMLElement;

  static mount(plugin: VaultSwitcherPlugin, document: Document): VaultSwitcherBar | null {
    const hostKind = document.body.hasClass("is-mobile") ? "mobile" : "desktop";
    const hostEl = document.querySelector<HTMLElement>(
      hostKind === "mobile" ? MOBILE_HOST_SELECTOR : DESKTOP_HOST_SELECTOR,
    );

    if (hostEl === null) {
      new Notice(
        "Failed to add Vault Switcher controls because the required DOM element could not be found.",
      );
      return null;
    }

    const bar = new VaultSwitcherBar(plugin, hostEl, hostKind);
    bar.render();
    return bar;
  }

  private constructor(
    private readonly plugin: VaultSwitcherPlugin,
    private readonly hostEl: HTMLElement,
    private readonly hostKind: "desktop" | "mobile",
  ) {
    hostEl.addClasses(["vault-switcher-host", `vault-switcher-host--${hostKind}`]);
    this.rootEl = hostEl.createDiv({
      cls: ["vault-switcher-bar", `vault-switcher-bar--${hostKind}`],
    });

    const nativeActions = hostEl.querySelector<HTMLElement>(
      hostKind === "mobile"
        ? ":scope > .workspace-drawer-header-icon"
        : ":scope > .workspace-drawer-vault-actions",
    );
    hostEl.insertBefore(this.rootEl, nativeActions);
  }

  render(): void {
    this.rootEl.empty();

    const vaultsEl = this.rootEl.createDiv({
      cls: "vault-switcher-bar__vaults",
    });

    for (const vault of this.plugin.settings.vaults) {
      const button = vaultsEl.createEl("button", {
        cls: ["vault-switcher-bar__button", "vault-switcher-bar__vault"],
        attr: {
          type: "button",
          "aria-label": vault.vaultName,
          title: vault.vaultName,
        },
      });
      renderVaultIcon(button, vault.icon);
      button.addEventListener("click", () => {
        this.rootEl.ownerDocument.defaultView?.open(
          `obsidian://open?vault=${encodeURIComponent(vault.vaultName)}`,
        );
      });
    }

    const settingsButton = this.rootEl.createEl("button", {
      cls: ["vault-switcher-bar__button", "vault-switcher-bar__settings"],
      attr: {
        type: "button",
        "aria-label": "Open settings",
        title: "Open settings",
      },
    });
    setIcon(settingsButton, "settings");
    settingsButton.addEventListener("click", () => {
      const app = this.plugin.app as typeof this.plugin.app & {
        setting: {
          open: () => void;
        };
      };

      app.setting.open();
    });
  }

  destroy(): void {
    this.rootEl.remove();
    this.hostEl.removeClasses(["vault-switcher-host", `vault-switcher-host--${this.hostKind}`]);
  }
}
