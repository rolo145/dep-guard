/**
 * NPQ Runner
 *
 * Handles execution of NPQ (npm package quality) commands.
 * Runs security checks in dry-run mode to validate packages
 * before installation.
 *
 * @module npq/NPQRunner
 * @see https://github.com/lirantal/npq
 */
import { tryRunCommand, runWithOutput } from "../utils/command";

export interface NPQCheckResult {
  packageSpec: string;
  passed: boolean;
}

export interface NPQCheckResultWithOutput extends NPQCheckResult {
  /** Raw output lines from NPQ (stdout + stderr), stripped of empty lines */
  outputLines: string[];
}

/**
 * Runner for NPQ command execution.
 *
 * Handles the low-level execution of NPQ commands and returns
 * structured results.
 */
export class NPQRunner {
  /**
   * Runs NPQ security check on a package (dry-run mode)
   *
   * NPQ checks for:
   * - Known vulnerabilities
   * - Suspicious package characteristics
   * - Malware signatures
   * - Package quality indicators
   *
   * @param packageSpec - Package specification (e.g., "chalk@5.0.0")
   * @returns Result object with pass/fail status
   */
  check(packageSpec: string): NPQCheckResult {
    // NOTE: NPQ exits 0 in --dry-run mode even when issues are found,
    // so `passed` here is unreliable. Prefer checkCapturingOutput() which
    // parses stdout for ERROR:/WARNING: lines instead of relying on exit code.
    // This method is kept for reference but is not used by the current codebase.
    const passed = tryRunCommand("npq", ["install", packageSpec, "--dry-run"]);

    return {
      packageSpec,
      passed,
    };
  }

  /**
   * Runs NPQ security checks on multiple packages
   *
   * @param packageSpecs - Array of package specifications
   * @returns Array of check results
   */
  checkBatch(packageSpecs: string[]): NPQCheckResult[] {
    return packageSpecs.map((spec) => this.check(spec));
  }

  /**
   * Runs NPQ security check and captures its output for programmatic use.
   *
   * Unlike check(), this method captures stdout/stderr instead of
   * inheriting the parent process streams. Use this for JSON output mode
   * or when you need to inspect NPQ's messages (e.g. for allowlist matching).
   *
   * @param packageSpec - Package specification (e.g., "chalk@5.0.0")
   * @returns Result with pass/fail status and captured output lines
   */
  checkCapturingOutput(packageSpec: string): NPQCheckResultWithOutput {
    const { output } = runWithOutput("npq", ["install", packageSpec, "--dry-run"]);

    // NPQ always exits 0 in --dry-run mode regardless of issues found.
    // Parse the output directly: issue lines start with "ERROR: " or "WARNING: ".
    // Strip the severity prefix so messages are clean for allowlist matching.
    const outputLines = output
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.startsWith("ERROR: ") || l.startsWith("WARNING: "))
      .map((l) => l.replace(/^(?:ERROR|WARNING): /, ""));

    return {
      packageSpec,
      passed: outputLines.length === 0,
      outputLines,
    };
  }
}
