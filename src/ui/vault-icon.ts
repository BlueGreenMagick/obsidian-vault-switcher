import { setIcon } from "obsidian";
import { DEFAULT_VAULT_ICON_SETTING, type VaultIconSetting } from "../settings";

export function renderVaultIcon(element: HTMLElement, icon: VaultIconSetting): void {
  element.empty();
  element.addClass("vault-switcher-icon");
  element.toggleClass("vault-switcher-icon--custom", icon.type === "custom");
  element.style.removeProperty("background-color");

  if (icon.type === "custom") {
    if (!icon.imageDataUrl) {
      setIcon(element, "image");
      return;
    }

    element.createEl("img", {
      cls: "vault-switcher-icon__image",
      attr: {
        src: icon.imageDataUrl,
        alt: "",
      },
    });
    return;
  }

  element.textContent = icon.text ?? DEFAULT_VAULT_ICON_SETTING.text;
  element.style.backgroundColor =
    icon.backgroundColor ?? DEFAULT_VAULT_ICON_SETTING.backgroundColor;
}
