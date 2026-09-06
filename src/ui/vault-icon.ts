import { setIcon } from "obsidian";
import { DEFAULT_VAULT_ICON_SETTING, type VaultIconSetting } from "../settings";

function getContrastTextColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  // W3C brightness formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#000" : "#fff";
}

export function renderVaultIcon(element: HTMLElement, icon: VaultIconSetting): void {
  element.empty();
  element.addClass("vault-switcher-icon");
  element.toggleClass("vault-switcher-icon--custom", icon.type === "custom");
  element.style.removeProperty("background-color");
  element.style.removeProperty("color");

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
  const backgroundColor = icon.backgroundColor ?? DEFAULT_VAULT_ICON_SETTING.backgroundColor;
  element.style.backgroundColor = backgroundColor;
  element.style.color = getContrastTextColor(backgroundColor);
}
