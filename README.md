# Obsidian Plugin - Vault Switcher

Vault Switcher is an Obsidian plugin for switching vaults with a single click.

## Development

Install dependencies and build the plugin:

```sh
pnpm install
pnpm run build
```

The build writes `main.js` and `manifest.json` to `./dist/`.

Then symlink the `./dist/` folder from the Obsidian plugin folder.

```sh
ln -s <path to ./dist/> folder-database
```

If you want to sync your plugins, you will need to copy the folder instead of symlinking.

### Creating a release

Run below command to create and upload new version tag. This makes use of `npm version` [lifecycle hook](https://docs.npmjs.com/cli/v8/commands/npm-version) and the script.

```sh
pnpm version 0.1.0
git push origin main 0.1.0
```

## Disclaimer

This plugin was developed with AI assistance, but all code was manually reviewed by a human.

This plugin is not affiliated with official Obsidian product.
