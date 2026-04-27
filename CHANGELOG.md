## [1.1.0] - 2026-04-23

### Added

- **Three standalone subcommands for automation:**
  - `dep-guard npq <package[@version]>` — Run an NPQ security check without installing; resolves the latest safe version when `@version` is omitted
  - `dep-guard scfw <package@version...>` — Install one or more packages directly via scfw
  - `dep-guard quality` — Run quality checks (lint, typecheck, test, build) standalone
- **`--json` output** on `npq`, `scfw`, `quality`, and `update --dry-run` for structured parsing in CI pipelines
- **Allowlist file** (`dep-guard-allowlist.json`) to pre-approve known NPQ warnings — supports `*` wildcards, case-insensitive matching; `requiresUserDecision: false` in JSON output signals automation can proceed without human input

### Fixed

- `dep-guard scfw` now rejects package specs without a version (e.g. `scfw lodash`) — previously forwarded bare names to npm, bypassing the safety buffer
- `SCFWRunner` now correctly reports `success: false` when scfw blocks an install due to CVEs — scfw exits 0 even when blocking, so output is now parsed for the block indicator
- `PackageResolverService` (used by `add` and `npq`) now sorts eligible versions by semver instead of publish date, fixing incorrect version selection on packages with parallel release branches
- `tryRunCommand` now throws a clear error when a required binary is not on PATH, instead of silently returning false
- `validateAndConfirm` now returns the actual `npqPassed` status — the install summary no longer falsely reports "NPQ passed" when the user overrode a failing check
- Registry errors during the update safety-buffer check now log at warning level (was `progress`, hidden in CI) so skipped buffers are always visible
- `--days 0` is now rejected with a clear error — minimum safety buffer is 1 day
- Malformed `package.json` now produces a friendly error instead of a raw `SyntaxError`
- `dep-guard install` now warns when `--lint`, `--typecheck`, `--test`, or `--build` flags are passed, as they have no effect on the install command
- Removed unreliable `NPQRunner.check()` and `checkBatch()` methods that reported pass/fail based on exit code (NPQ always exits 0 in dry-run mode)

[1.1.0]: https://github.com/rolo145/dep-guard/compare/v1.0.2...v1.1.0

---

## [1.0.2] - 2026-04-16

### Fixed

- Updated README to reflect current version

[1.0.2]: https://github.com/rolo145/dep-guard/compare/v1.0.1...v1.0.2

---

## [1.0.1] - 2026-04-11

### Fixed

- Fix version sorting to prevent downgrades on parallel release branches

[1.0.1]: https://github.com/rolo145/dep-guard/compare/v1.0.0...v1.0.1

---

## [1.0.0] - 2026-01-25

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
