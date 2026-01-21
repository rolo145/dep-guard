# dep-guard

Preview release: this CLI is in early development and may change before a stable 1.0.

Guardrail CLI for safer npm dependency management. dep-guard provides two commands for managing dependencies:

1. **Fresh install** - Install all dependencies from package.json with security checks
2. **Safe updates** - Update dependencies with time-based safety buffer, NPQ checks, and quality gates

## Commands

### `dep-guard install`

Fresh install of all dependencies from package.json:
- Installs via `scfw run npm install --ignore-scripts --before <date>` (or `npm install --ignore-scripts --before <date>` with `--allow-npm-install`)
- Uses a configurable safety buffer (default: 7 days) to avoid installing versions published too recently
- Regenerates package-lock.json
- Applies security protections during installation

### `dep-guard update`

Safe dependency updates with guardrails:
- Finds available updates via npm-check-updates
- Filters out versions newer than a configurable safety buffer (default: 7 days)
- Groups updates by major/minor/patch and prompts for selection
- Runs NPQ security checks per package and asks for confirmation
- Installs through scfw with `--save-exact`, `--ignore-scripts`, and `--before <date>` (or `npm install` with same flags via `--allow-npm-install`)
- Reinstalls dependencies via `npm ci --ignore-scripts`
- Optionally runs lint, typecheck, tests, and build scripts

## Requirements

- Node.js >= 24
- npm
- `scfw` installed (Supply Chain Firewall) - recommended but optional
  - `pipx install scfw` (recommended)
  - or `pip install scfw`
  - If scfw is not installed, use `--allow-npm-install` to fall back to npm install

More info: https://github.com/DataDog/supply-chain-firewall

## Breaking Changes (v0.1.0-preview.2+)

**Subcommands are now required.** Previously, running `dep-guard` without arguments would start the update workflow. Now you must specify a subcommand:
- `dep-guard update` - For the update workflow (previous default behavior)
- `dep-guard install` - For fresh install from package.json (new feature)

Running `dep-guard` without a subcommand will show an error message with usage instructions.

## Usage

Once built/installed, run with a subcommand:

```
dep-guard <subcommand> [options]
```

### Subcommands

- `install` - Fresh install from package.json
- `update` - Check for and install package updates

### Options

- `-d, --days <number>`: Safety buffer in days (default: 7) - applies to both install and update commands
- `--allow-npm-install`: Use npm install fallback when scfw is not available
- `--lint <script>`: Lint script name (default: `lint`) **[update only]**
- `--typecheck <script>`: Type check script name (default: `typecheck`) **[update only]**
- `--test <script>`: Test script name (default: `test`) **[update only]**
- `--build <script>`: Build script name (default: `build`) **[update only]**
- `-v, --version`: Show version
- `-h, --help`: Show help

### Examples

```bash
# Fresh install from package.json
dep-guard install

# Fresh install with a 14-day safety buffer
dep-guard install --days 14

# Fresh install using npm fallback when scfw is not available
dep-guard install --allow-npm-install

# Check for updates with default settings
dep-guard update

# Update with a 14-day safety buffer
dep-guard update --days 14

# Update using npm install fallback
dep-guard update --allow-npm-install

# Update with custom script names
dep-guard update --lint eslint --test test:all --build build:prod
```

## Install / run (npm package)

```bash
# install globally
npm install -g @roland.botka/dep-guard

# then run
dep-guard install          # fresh install
dep-guard update          # check for updates

# or run once without installing
npx @roland.botka/dep-guard install
npx @roland.botka/dep-guard update
```

## Install / run locally

This repo ships a CLI entry point at `dist/index.js` after build.

```bash
# install deps
npm install

# build CLI
npm run build

# run locally
node ./dist/index.js --help
node ./dist/index.js install
node ./dist/index.js update
```

If you want the `dep-guard` command available on your PATH while developing:

```bash
npm link

dep-guard --help
dep-guard install
dep-guard update
```

## Development

```
# typecheck
npm run typecheck

# tests
npm test

# coverage
npm run test:coverage
```

## Notes

- The quality checks (lint/typecheck/test/build) are optional and will be skipped if the configured script name does not exist in the target project's `package.json`.
- Install steps intentionally run with `--ignore-scripts` to reduce supply-chain risk.

## License

MIT (see `LICENSE`).
