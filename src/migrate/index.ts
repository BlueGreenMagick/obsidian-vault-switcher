import { SETTINGS_VERSION, type PluginSetting as CurrentSetting } from "../settings";
import { migrateV2 } from "./v2";

type New = Record<string, never>;
type V2 = Parameters<typeof migrateV2>[0];

/** Settings before initialization, an older V2 configuration, or the current schema. */
export type RawPluginSetting = New | V2 | CurrentSetting;

export function createInitialSettings(): CurrentSetting {
  return {
    settingVersion: SETTINGS_VERSION,
    mobileBarAtTop: false,
    vaults: [],
  };
}

/**
 * Raw settings are assumed to be valid for their version.
 *
 * Returns a different object reference if the configuration changes.
 * Returns original reference when no changes are needed.
 */
export function parseAndMigrateRawSettings(raw: RawPluginSetting): CurrentSetting {
  let settings = raw;
  if (!("settingVersion" in settings)) {
    settings = createInitialSettings();
  }

  // Settings version 1 was not published.
  if (settings.settingVersion === 2) {
    settings = migrateV2(settings as V2);
  }

  if (settings.settingVersion === SETTINGS_VERSION) {
    return settings;
  }

  throw new Error(
    `Unsupported settings version: "${settings.settingVersion}". Current settings version: "${SETTINGS_VERSION}".`,
  );
}
