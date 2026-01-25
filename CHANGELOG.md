## [1.0.0] - 2026-01-23

Initial stable release of **dep-guard**, a guardrail CLI for safer npm dependency management.

### Added

- **Three stable commands:**
  - `dep-guard install` – Fresh dependency install with security protections
  - `dep-guard update` – Safe dependency updates with guardrails
  - `dep-guard add <package>` – Securely add new dependencies

- **Security-first workflows:**
  - Supply Chain Firewall (`scfw`) integration (recommended)
  - NPQ security validation for all installs and updates
  - `--ignore-scripts` enforced by default
  - `--allow-npm-install` fallback when scfw is unavailable

- **Time-based safety buffer:**
  - Default 7-day delay for newly published versions
  - Customizable via `--days` flag

- **Update workflow:**
  - npm-check-updates integration
  - Interactive selection grouped by major/minor/patch
  - `--dry-run` mode to preview updates without installing

- **Quality gates (optional):**
  - Lint, typecheck, test, and build verification
  - Automatically skipped if scripts are missing

- **Add dependency workflow:**
  - Exact version pinning
  - Dev dependency support (`-D`)
  - Duplicate detection with user confirmation

### Notes

- dep-guard 1.0.0 defines a **stable CLI contract**
- Commands and flags are considered stable across 1.x releases
- Node.js 24+ is required

### Requirements

- Node.js >= 24
- npm

[1.0.0]: https://github.com/rolo145/dep-guard/releases/tag/v1.0.0
