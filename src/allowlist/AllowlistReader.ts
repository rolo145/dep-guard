/**
 * Allowlist Reader
 *
 * Reads and applies the dep-guard-allowlist.json file.
 * The allowlist lets teams record accepted NPQ warnings so that
 * previously reviewed packages don't require manual confirmation again.
 *
 * Pattern matching supports glob-style wildcards:
 *   "*" matches any sequence of characters
 *
 * @module allowlist/AllowlistReader
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { FILES } from "../constants/files";
import type { AllowlistFile, AllowlistCheckResult } from "./types";

/**
 * Strips ANSI escape codes from a string.
 * Covers SGR (colors/styles), cursor movement, erase sequences, and OSC sequences.
 */
function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\u001B\u009B][[\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\d\/#&.:=?%@~_]+)*|[a-zA-Z\d]+(?:;[-a-zA-Z\d\/#&.:=?%@~_]*)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-ntqry=><~]))/g, "");
}

/**
 * Tests whether a message matches a glob-style pattern.
 * Supports * as a wildcard that matches any sequence of characters.
 *
 * Consecutive wildcards are collapsed to prevent catastrophic backtracking
 * on long strings that don't match (ReDoS mitigation).
 */
function matchesGlobPattern(message: string, pattern: string): boolean {
  // Escape all regex special chars except *
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  // Replace * with .*, then collapse consecutive .* to a single .*
  const regexStr = "^" + escaped.replace(/\*/g, ".*").replace(/(\.\*)+/g, ".*") + "$";
  return new RegExp(regexStr, "i").test(message);
}

/**
 * Reads and queries the dep-guard allowlist file.
 *
 * The allowlist file (dep-guard-allowlist.json) lives in the current
 * working directory (project root). If the file does not exist, all
 * packages are treated as having an empty allowlist.
 */
export class AllowlistReader {
  private allowlist: AllowlistFile;

  constructor() {
    this.allowlist = this.load();
  }

  /**
   * Loads the allowlist from disk.
   * Returns an empty object if the file does not exist.
   */
  private load(): AllowlistFile {
    const filePath = join(process.cwd(), FILES.ALLOWLIST);
    if (!existsSync(filePath)) {
      return {};
    }
    try {
      const content = readFileSync(filePath, "utf-8");
      return JSON.parse(content) as AllowlistFile;
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      process.stderr.write(`dep-guard: warning: could not parse ${FILES.ALLOWLIST}: ${reason}\n`);
      return {};
    }
  }

  /**
   * Returns the accepted patterns for a given package name.
   *
   * @param packageName - Package name without version (e.g. "lodash")
   */
  getPatternsFor(packageName: string): string[] {
    return this.allowlist[packageName] ?? [];
  }

  /**
   * Checks a list of issue messages against the allowlist for a package.
   *
   * @param packageName - Package name without version
   * @param messages - Raw output lines from NPQ to check
   */
  check(packageName: string, messages: string[]): AllowlistCheckResult {
    const patterns = this.getPatternsFor(packageName);
    const allowlisted: string[] = [];
    const unmatched: string[] = [];

    for (const message of messages) {
      const clean = stripAnsi(message).trim();
      if (!clean) continue;

      const matched = patterns.some((pattern) => matchesGlobPattern(clean, pattern));
      if (matched) {
        allowlisted.push(clean);
      } else {
        unmatched.push(clean);
      }
    }

    return {
      allowlisted,
      unmatched,
      allAllowlisted: unmatched.length === 0,
    };
  }
}
