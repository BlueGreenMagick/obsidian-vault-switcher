import { generateVaultId } from "../utils";

// Migration schemas are snapshots. Keep each version independent of the current runtime types.
interface SettingsV2 {
  settingVersion: 2;
  mobileBarAtTop: boolean;
  vaults: {
    vaultName: string;
    icon: {
      type: "simple" | "custom";
      text?: string;
      backgroundColor?: string;
      imageDataUrl?: string;
    };
  }[];
}

interface SettingsV3 {
  settingVersion: 3;
  mobileBarAtTop: boolean;
  vaults: {
    id: string;
    vaultName: string;
    icon: {
      type: "simple" | "custom";
      text?: string;
      backgroundColor?: string;
      imageDataUrl?: string;
    };
  }[];
}

export function migrateV2(settings: SettingsV2): SettingsV3 {
  return {
    ...settings,
    settingVersion: 3,
    mobileBarAtTop: settings.mobileBarAtTop ?? false,
    vaults: (settings.vaults ?? []).map((vault) => {
      const id = generateVaultId();
      return {
        ...vault,
        id,
        icon: {
          ...vault.icon,
          type: vault.icon.type ?? "simple",
          text: vault.icon.text ?? "",
          backgroundColor: vault.icon.backgroundColor ?? "#808080",
          imageDataUrl: vault.icon.imageDataUrl ?? "",
        },
      };
    }),
  };
}
