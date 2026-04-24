# dep-guard

Guardrail CLI for safer npm dependency management.  
dep-guard provides secure workflows for installing, updating, and adding npm dependencies with built-in security checks and time-based safety buffers.

> dep-guard is intentionally opinionated: it favors security and explicit decisions over speed and convenience.

This is a **stable (1.1.0)** release. Commands and flags are considered stable across 1.x versions.

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

🤖 **Automation-Friendly**
- Standalone subcommands for each pipeline stage
- `--json` output on all subcommands for structured parsing
- Allowlist file to pre-approve known NPQ warnings

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
- `--dry-run --json` mode outputs structured update list for automation
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

### `dep-guard npq <package[@version]>`

Run an NPQ security check on a single package without installing it. If `@version` is omitted, the latest safe version (per the safety buffer) is resolved automatically.

- Checks against the [allowlist file](#allowlist) — known-safe warnings skip user confirmation
- `--json` outputs structured results for automation

**JSON output:**
```json
{
  "package": "lodash@4.17.21",
  "passed": false,
  "requiresUserDecision": true,
  "issues": [
    "Supply Chain Security - 3 vulnerabilities found by OSV for lodash",
    "Supply Chain Security - Unable to verify provenance: the package was published without any attestations"
  ],
  "allowlisted": []
}
```

- `passed: true` — no issues found
- `requiresUserDecision: false` — issues exist but all are in the allowlist; proceed automatically
- `requiresUserDecision: true` — unrecognized issues; show to user before proceeding

---

### `dep-guard scfw <package@version...>`

Install one or more packages via scfw (Supply Chain Firewall).

- `--json` outputs a structured result
- Multiple packages can be passed in a single invocation

**JSON output:**
```json
{
  "success": true,
  "packages": ["lodash@4.17.21", "chalk@5.3.0"],
  "error": null
}
```

---

### `dep-guard quality`

Run quality checks (lint, typecheck, test, build) standalone.

- Only runs checks that have a matching npm script
- Checks with no matching script are reported as skipped (not failures)
- `--json` outputs per-check results

**JSON output:**
```json
{
  "success": true,
  "checks": {
    "lint":      { "ran": true,  "passed": true,  "skipped": false },
    "typecheck": { "ran": true,  "passed": true,  "skipped": false },
    "test":      { "ran": true,  "passed": false, "skipped": false },
    "build":     { "ran": false, "passed": null,  "skipped": true  }
  }
}
```

---

## Allowlist

The allowlist file (`dep-guard-allowlist.json`) maps package names to NPQ warning patterns that your project has accepted. When all issues for a package are allowlisted, `dep-guard npq` sets `requiresUserDecision: false` so automation can proceed without human input.

**Example:**
```json
{
  "lodash": [
    "Supply Chain Security - Unable to verify provenance: *"
  ],
  "chalk": [
    "Package Health - Detected an old package: *"
  ]
}
```

- Patterns support `*` as a wildcard for variable text (e.g. day counts, version numbers)
- Matching is case-insensitive
- Place the file in your project root

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

Issues found by NPQ are matched against the allowlist. Unrecognized issues require explicit user approval.

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
- `npq <package[@version]>` – Run NPQ security check on a single package
- `scfw <package@version...>` – Install packages via scfw
- `quality` – Run quality checks standalone

### Options

| Flag | Default | Applies to | Description |
|---|---|---|---|
| `-d, --days <n>` | `7` | all | Safety buffer in days. Versions published more recently than this are excluded. Increase for stricter safety, decrease if you need faster access to new releases. |
| `--allow-npm-install` | off | `install`, `update` | Fall back to plain `npm install` when `scfw` is not available. Not recommended for production workflows — scfw is the preferred install path. |
| `--dry-run` | off | `update` | Show available updates and their version bumps without installing anything. Combine with `--json` for structured output suitable for automation or AI agents. |
| `--json` | off | `npq`, `scfw`, `quality`, `update --dry-run` | Output structured JSON instead of interactive output. Intended for automation, CI pipelines, and AI agent integrations. See each command section for the exact schema. |
| `-D, --save-dev` | off | `add` | Install the package as a dev dependency (`devDependencies`). |
| `--lint <script>` | `lint` | `update`, `quality` | Name of the npm script to use for linting. If the script is not present in `package.json`, the lint check is skipped gracefully. |
| `--typecheck <script>` | `typecheck` | `update`, `quality` | Name of the npm script to use for type checking. Skipped if the script is missing. |
| `--test <script>` | `test` | `update`, `quality` | Name of the npm script to use for running tests. Skipped if the script is missing. |
| `--build <script>` | `build` | `update`, `quality` | Name of the npm script to use for building. Skipped if the script is missing. |
| `-v, --version` | — | all | Print the installed dep-guard version and exit. |
| `-h, --help` | — | all | Print the help message and exit. |

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

## AI Update

A **dep-guard-update skill** is available for AI coding agents (Claude Code and others). It turns dep-guard into a guided, conversational dependency update workflow — the agent discovers available updates, runs security checks, explains risks in plain language, and installs only what you approve.

**What the skill does:**

- Runs `dep-guard update --dry-run --json` and presents updates as a numbered list
- Runs `dep-guard npq` for each selected package and explains each warning in plain language (low / medium / high risk)
- Distinguishes allowlisted warnings (proceed silently) from genuine issues (wait for approval)
- Installs approved packages via `dep-guard scfw` and handles supply chain blocks with context
- Optionally runs `dep-guard quality` and reports results

**Get the skill:** [github.com/rolo145/rolo-skills](https://github.com/rolo145/rolo-skills)

**Usage in Claude Code:**

```
/dep-guard-update
```

The skill file can be installed from the repository above and invoked as a slash command in any Claude Code session.

---

## Notes

- Quality checks are optional and skipped if scripts are missing
- All installs intentionally use `--ignore-scripts` by default

---

## License

MIT (see `LICENSE`)
