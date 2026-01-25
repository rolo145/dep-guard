# dep-guard

Guardrail CLI for safer npm dependency management. dep-guard provides three commands for managing dependencies:

1. **Fresh install** - Install all dependencies from package.json with security checks
2. **Safe updates** - Update dependencies with time-based safety buffer, NPQ checks, and quality gates
3. **Add package** - Add new dependencies with security validation and safety buffer checks

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

**Dry-run mode**: Use `--dry-run` to preview available updates without installing them

### `dep-guard add <package>`

Add a new dependency with security checks:
- Resolves package version (user-specified or latest safe version)
- Applies safety buffer to ensure version is at least N days old (default: 7 days)
- Checks if package already exists and prompts for action (update/keep/cancel)
- Runs NPQ security validation and asks for confirmation
- Installs through scfw with `--save-exact`, `--ignore-scripts`, and `--before <date>` (or `npm install` with same flags via `--allow-npm-install`)
- Reinstalls dependencies via `npm ci --ignore-scripts`
- Updates package.json and package-lock.json
- Supports both regular dependencies and dev dependencies (`-D` flag)
- Only adds one package at a time (no multiple packages)

## Requirements

- Node.js >= 24
- npm
- `scfw` installed (Supply Chain Firewall) - recommended (strongly) but optional
  - `pipx install scfw` (recommended)
  - or `pip install scfw`
  - If scfw is not installed, use `--allow-npm-install` to fall back to npm install

More info: https://github.com/DataDog/supply-chain-firewall

## Usage

Once built/installed, run with a subcommand:

```
dep-guard <subcommand> [options]
```

### Subcommands

- `install` - Fresh install from package.json
- `update` - Check for and install package updates
- `add <package>` - Add a new package with security checks

### Options

- `-d, --days <number>`: Safety buffer in days (default: 7) - applies to all commands
- `--allow-npm-install`: Use npm install fallback when scfw is not available
- `-D, --save-dev`: Add as dev dependency **[add only]**
- `--dry-run`: Show available updates without installing (dry-run) **[update only]**
- `--lint <script>`: Lint script name (default: `lint`) **[update only]**
- `--typecheck <script>`: Type check script name (default: `typecheck`) **[update only]**
- `--test <script>`: Test script name (default: `test`) **[update only]**
- `--build <script>`: Build script name (default: `build`) **[update only]**
- `-v, --version`: Show version
- `-h, --help`: Show help

### Flag Validation Rules

Some flags cannot be combined due to incompatible functionality:

**1. --dry-run cannot be combined with quality check flags**

The `--dry-run` flag displays available updates and exits before installation or quality checks run. Therefore, it cannot be combined with:
- `--lint`
- `--typecheck`
- `--test`
- `--build`

```bash
# ❌ These will fail with an error
dep-guard update --dry-run --lint eslint
dep-guard update --dry-run --test vitest
dep-guard update --dry-run --lint eslint --test jest

# ✅ These work fine
dep-guard update --dry-run                    # Dry-run mode alone
dep-guard update --dry-run --days 14          # Dry-run with compatible flags
dep-guard update --lint eslint --test jest # Quality checks without dry-run
```

**2. -D/--save-dev can only be used with the add command**

The `-D`/`--save-dev` flag is specific to adding packages and cannot be used with `update` or `install`:

```bash
# ❌ These will fail with an error
dep-guard update -D
dep-guard install --save-dev

# ✅ These work fine
dep-guard add vue -D                    # Add as dev dependency
dep-guard add typescript --save-dev     # Add as dev dependency
dep-guard update --days 14              # Update without -D
dep-guard install                       # Install without -D
```

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

# Preview available updates without installing (dry-run)
dep-guard update --dry-run

# Preview updates with custom safety buffer
dep-guard update --dry-run --days 14

# Update using npm install fallback
dep-guard update --allow-npm-install

# Update with custom script names
dep-guard update --lint eslint --test test:all --build build:prod

# Add latest safe version of a package
dep-guard add vue

# Add specific version of a package
dep-guard add vue@3.2.0

# Add scoped package as dev dependency
dep-guard add @vue/cli -D

# Add package with custom safety buffer
dep-guard add typescript -D --days 14

# Add package using npm fallback
dep-guard add react --allow-npm-install
```

## Install / run (npm package)

```bash
# install globally
npm install -g @roland.botka/dep-guard

# then run
dep-guard install          # fresh install
dep-guard update           # check for updates
dep-guard add vue          # add new package

# or run once without installing
npx @roland.botka/dep-guard install
npx @roland.botka/dep-guard update
npx @roland.botka/dep-guard add vue
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
node ./dist/index.js add vue
```

If you want the `dep-guard` command available on your PATH while developing:

```bash
npm link

dep-guard --help
dep-guard install
dep-guard update
dep-guard add vue
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
