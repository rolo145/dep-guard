# dep-guard

Guardrail CLI for safer npm dependency management.  
dep-guard provides secure workflows for installing, updating, and adding npm dependencies with built-in security checks and time-based safety buffers.

> dep-guard is intentionally opinionated: it favors security and explicit decisions over speed and convenience.

This is the first **stable (1.0.0)** release. Commands and flags are considered stable across 1.x versions.

---

## Quick Start

```bash
npm install -g @roland.botka/dep-guard
dep-guard update --dry-run
```

---

## Key Features

🔒 **Security-First**
- Integration with [scfw](https://github.com/DataDog/supply-chain-firewall) (Supply Chain Firewall)
- NPQ security checks for every package
- Time-based safety buffer (default: 7 days)
- All installs run with `--ignore-scripts` by default

🎯 **Interactive & User-Friendly**
- Interactive package selection (checkboxes)
- Clear confirmation prompts at every step
- Dry-run mode to preview updates safely
- Helpful, actionable error messages

✅ **Quality Gates (Optional)**
- Lint, typecheck, test, and build verification
- Configurable script names
- Graceful skips for missing scripts

📦 **Exact Version Management**
- All installs use `--save-exact` (no `^` or `~`)
- Reproducible dependency trees
- Only versions older than the safety buffer are allowed

---

## Commands

### `dep-guard install`

Fresh install of all dependencies from `package.json`:

- Uses `scfw run npm install --ignore-scripts --before <date>`
- Falls back to `npm install` with the same flags when `--allow-npm-install` is used
- Applies the safety buffer (default: 7 days)
- Regenerates `package-lock.json`

---

### `dep-guard update`

Safe dependency updates with multiple guardrails.

**Workflow:**
1. Check for updates via npm-check-updates
2. Apply safety buffer (exclude versions < 7 days old)
3. Group updates by Major / Minor / Patch
4. Interactive selection
5. NPQ security validation
6. Secure installation via scfw
7. Clean reinstall (`npm ci --ignore-scripts`)
8. Optional quality checks
9. Optional build verification

**Highlights:**
- Interactive update selection
- Per-package NPQ validation
- `--dry-run` mode (no install, no scfw required)
- User can cancel at any point (Ctrl+C)

---

### `dep-guard add <package>`

Add a new dependency with security validation:

- Resolves user-specified or latest safe version
- Applies safety buffer (default: 7 days)
- Detects existing dependencies (update / keep / cancel)
- NPQ security validation before install
- Installs with `--save-exact`
- Supports dev dependencies via `-D`
- One package per invocation

---

## Requirements

- Node.js **>= 24**
- npm
- **scfw** (Supply Chain Firewall) — **strongly recommended**
  - Install via `pipx install scfw` (recommended) or `pip install scfw`
  - https://github.com/DataDog/supply-chain-firewall
  - If scfw is not available, use `--allow-npm-install` to fall back to npm

---

## Security Model

### scfw (Supply Chain Firewall)

When available, dep-guard always prefers scfw to:
- Block known vulnerable packages
- Detect suspicious behavior
- Enforce security policies during install

### NPQ (Node Package Query)

NPQ checks run before every install:
- Supply-chain risk signals
- Package health & maintenance status
- Provenance verification

Users must explicitly approve risky packages.

### Why a Safety Buffer?

Waiting N days (default: 7) protects against:
- Typosquatting attacks
- Compromised maintainer accounts
- Rushed or broken releases
- Early-stage supply-chain attacks

---

## Usage

```bash
dep-guard <command> [options]
```

### Commands
- `install` – Fresh install from package.json
- `update` – Safe dependency updates
- `add <package>` – Securely add a dependency

### Options
- `-d, --days <n>` – Safety buffer in days (default: 7)
- `--allow-npm-install` – Allow npm fallback
- `--dry-run` – Preview updates without installing (update only)
- `-D, --save-dev` – Add as dev dependency (add only)
- `--lint <script>` – Lint script (update only)
- `--typecheck <script>` – Typecheck script (update only)
- `--test <script>` – Test script (update only)
- `--build <script>` – Build script (update only)
- `-v, --version`
- `-h, --help`

---

## Install / Run

```bash
npm install -g @roland.botka/dep-guard

dep-guard install
dep-guard update
dep-guard add vue
```

Or without installing:

```bash
npx @roland.botka/dep-guard update --dry-run
```

---

## Development

```bash
npm run typecheck
npm test
npm run test:coverage
```

---

## Notes

- Quality checks are optional and skipped if scripts are missing
- All installs intentionally use `--ignore-scripts` by default

---

## License

MIT (see `LICENSE`)

