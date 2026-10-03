import type { Command, Plugin } from "obsidian";
import type { VaultSetting } from "./settings";
import { openVault } from "./utils";

export class CommandsManager {
  private readonly registeredCommands = new Map<string, Command>();

  constructor(private readonly plugin: Plugin) {}

  sync(vaults: readonly VaultSetting[]): void {
    const vaultIds = new Set(vaults.map((vault) => vault.id));

    for (const id of this.registeredCommands.keys()) {
      if (!vaultIds.has(id)) {
        this.plugin.removeCommand(this.commandId(id));
        this.registeredCommands.delete(id);
      }
    }

    for (const vault of vaults) {
      const existingCommand = this.registeredCommands.get(vault.id);
      if (existingCommand !== undefined) {
        // addCommand prefixes the name; retain that prefix when updating the registered object.
        existingCommand.name = `${this.plugin.manifest.name}: Switch to '${vault.vaultName}'`;
        existingCommand.callback = () => openVault(vault.vaultName);
        continue;
      }

      const command = this.plugin.addCommand({
        id: this.commandId(vault.id),
        name: `Switch to '${vault.vaultName}'`,
        callback: () => openVault(vault.vaultName),
      });
      this.registeredCommands.set(vault.id, command);
    }
  }

  private commandId(vaultId: string): string {
    return `switch-vault-${vaultId}`;
  }
}
