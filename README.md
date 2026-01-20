# dep-guard

Preview release: this CLI is in early development and may change before a stable 1.0.

Guardrail CLI for safer npm dependency updates. dep-guard combines a time-based safety buffer, NPQ checks, and Supply Chain Firewall installs with optional quality gates so you can update dependencies with more confidence.

## What it does

- Finds available updates via npm-check-updates
- Filters out versions newer than a configurable safety buffer (default: 7 days)
- Groups updates by major/minor/patch and prompts for selection
- Runs NPQ security checks per package and asks for confirmation
- Installs through scfw with `--save-exact`, `--ignore-scripts`, and `--before <date>`
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

## Usage

Once built/installed, run:

```
dep-guard [options]
```

Options:

- `-d, --days <number>`: Safety buffer in days (default: 7)
- `--allow-npm-install`: Use npm install fallback when scfw is not available
- `--lint <script>`: Lint script name (default: `lint`)
- `--typecheck <script>`: Type check script name (default: `typecheck`)
- `--test <script>`: Test script name (default: `test`)
- `--build <script>`: Build script name (default: `build`)
- `-v, --version`: Show version
- `-h, --help`: Show help

Examples:

```
# Run with defaults

dep-guard

# Use a 14-day safety buffer

dep-guard --days 14

# Use npm install fallback when scfw is not installed

dep-guard --allow-npm-install

# Customize script names

dep-guard --lint eslint --test test:all --build build:prod
```

## Install / run (npm package)

```
# install globally
npm install -g @roland.botka/dep-guard

# or run once without installing
npx @roland.botka/dep-guard
```

## Install / run locally

This repo ships a CLI entry point at `dist/index.js` after build.

```
# install deps
npm install

# build CLI
npm run build

# run locally
node ./dist/index.js --help
```

If you want the `dep-guard` command available on your PATH while developing:

```
npm link

dep-guard --help
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
