import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import path from "path";

/**
 * E2E tests for the CLI entry point
 *
 * These tests spawn actual processes to test the CLI integration.
 * They provide smoke testing for the main entry point and subcommand routing.
 */
describe("CLI E2E Tests", () => {
  const cliPath = path.join(__dirname, "../../../dist/index.js");

  /**
   * Helper to run the CLI command
   */
  function runCli(args: string): { stdout: string; stderr: string; exitCode: number } {
    try {
      const stdout = execSync(`node ${cliPath} ${args}`, {
        encoding: "utf8",
        stdio: "pipe",
      });
      return { stdout, stderr: "", exitCode: 0 };
    } catch (error: any) {
      return {
        stdout: error.stdout?.toString() || "",
        stderr: error.stderr?.toString() || "",
        exitCode: error.status || 1,
      };
    }
  }

  describe("--help flag", () => {
    it("shows help message and exits with code 0", () => {
      const result = runCli("--help");

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Usage:");
      expect(result.stdout).toContain("Subcommands:");
      expect(result.stdout).toContain("install");
      expect(result.stdout).toContain("update");
      expect(result.stdout).toContain("add");
    });

    it("handles -h short flag", () => {
      const result = runCli("-h");

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Usage:");
    });
  });

  describe("--version flag", () => {
    it("shows version and exits with code 0", () => {
      const result = runCli("--version");

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/dep-guard v\d+\.\d+\.\d+/);
    });

    it("handles -v short flag", () => {
      const result = runCli("-v");

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/dep-guard v\d+\.\d+\.\d+/);
    });
  });

  describe("subcommand validation", () => {
    it("shows error when no subcommand provided", () => {
      const result = runCli("");

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Please specify a subcommand");
      expect(result.stderr).toContain("install");
      expect(result.stderr).toContain("update");
      expect(result.stderr).toContain("add");
    });

    it("shows error for unknown subcommand", () => {
      const result = runCli("unknown");

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Unknown subcommand: unknown");
    });
  });

  describe("add command validation", () => {
    it("shows error when no package specified", () => {
      const result = runCli("add");

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("No package specified");
      expect(result.stderr).toContain("Usage: dep-guard add <package>");
    });

    it("shows error for multiple packages", () => {
      const result = runCli("add vue react");

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Only one package can be added at a time");
    });

    it("shows error for invalid package name", () => {
      const result = runCli("add .invalid");

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Error:");
    });

    it("shows error for version range", () => {
      const result = runCli("add vue@^3.0.0");

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("not a version range");
    });
  });
});
