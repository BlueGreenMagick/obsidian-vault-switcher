import { App, Modal, Notice, Setting, TextAreaComponent } from "obsidian";

export class ImportConfigurationModal extends Modal {
  constructor(
    app: App,
    private readonly onImport: (raw: unknown) => Promise<void>,
  ) {
    super(app);
  }

  onOpen(): void {
    this.setTitle("Import configuration");
    this.contentEl.createEl("p", {
      text: "Paste an exported configuration. Importing replaces the current configuration.",
    });

    const input = new TextAreaComponent(this.contentEl);
    input.setPlaceholder("Paste configuration JSON");
    input.inputEl.addClass("vault-switcher-configuration-modal__textarea");

    new Setting(this.contentEl)
      .addButton((button) =>
        button.setButtonText("Cancel").onClick(() => this.close()),
      )
      .addButton((button) =>
        button
          .setButtonText("Import")
          .setCta()
          .onClick(async () => {
            button.setDisabled(true);

            try {
              const raw = JSON.parse(input.getValue()) as unknown;
              await this.onImport(raw);
              this.close();
              new Notice("Configuration imported.");
            } catch (error) {
              button.setDisabled(false);
              new Notice(getImportErrorMessage(error));
            }
          }),
      );

    input.inputEl.focus();
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

export class ExportConfigurationModal extends Modal {
  constructor(
    app: App,
    private readonly configuration: string,
  ) {
    super(app);
  }

  onOpen(): void {
    this.setTitle("Export configuration");
    this.contentEl.createEl("p", {
      text: "Copy this configuration, then import it in another vault.",
    });

    const output = new TextAreaComponent(this.contentEl);
    output.setValue(this.configuration);
    output.inputEl.readOnly = true;
    output.inputEl.addClass("vault-switcher-configuration-modal__textarea");

    new Setting(this.contentEl)
      .addButton((button) =>
        button.setButtonText("Close").onClick(() => this.close()),
      )
      .addButton((button) =>
        button
          .setButtonText("Copy")
          .setCta()
          .onClick(async () => {
            try {
              const clipboard =
                this.contentEl.ownerDocument.defaultView?.navigator.clipboard;
              if (clipboard === undefined) {
                throw new Error("Clipboard access is unavailable.");
              }

              await clipboard.writeText(this.configuration);
              new Notice("Configuration copied.");
            } catch {
              output.inputEl.focus();
              output.inputEl.select();
              new Notice(
                "Failed to copy to clipboard. Please copy the configuration manually.",
              );
            }
          }),
      );

    output.inputEl.focus();
    output.inputEl.select();
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

function getImportErrorMessage(error: unknown): string {
  if (error instanceof SyntaxError) {
    return "Could not import configuration: the pasted text is not valid JSON.";
  }

  if (error instanceof Error) {
    return `Could not import configuration: ${error.message}`;
  }

  return "Could not import configuration.";
}
