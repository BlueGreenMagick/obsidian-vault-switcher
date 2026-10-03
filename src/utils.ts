export function openVault(vaultName: string): void {
  window.open(`obsidian://open?vault=${encodeURIComponent(vaultName)}`);
}

/** Generates a 13-character alphanumeric ID by mapping each random byte to a base36 digit. */
export function generateVaultId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(13));
  return Array.from(bytes, (byte) => (byte % 36).toString(36)).join("");
}
