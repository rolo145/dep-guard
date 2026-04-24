import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("child_process", () => ({
  spawnSync: vi.fn(),
}));

import { tryRunCommand, runWithOutput } from "../command";
import { spawnSync } from "child_process";

describe("command utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("tryRunCommand()", () => {
    it("calls spawnSync with correct arguments", () => {
      vi.mocked(spawnSync).mockReturnValue({ status: 0 } as any);

      tryRunCommand("npm", ["install", "lodash"]);

      expect(spawnSync).toHaveBeenCalledWith(
        "npm",
        ["install", "lodash"],
        { stdio: "inherit", shell: false }
      );
    });

    it("returns true when command succeeds (exit code 0)", () => {
      vi.mocked(spawnSync).mockReturnValue({ status: 0 } as any);

      const result = tryRunCommand("npm", ["--version"]);

      expect(result).toBeTruthy();
    });

    it("returns false when command fails (exit code 1)", () => {
      vi.mocked(spawnSync).mockReturnValue({ status: 1 } as any);

      const result = tryRunCommand("npm", ["invalid-command"]);

      expect(result).toBeFalsy();
    });

    it("returns false when command fails (exit code non-zero)", () => {
      vi.mocked(spawnSync).mockReturnValue({ status: 127 } as any);

      const result = tryRunCommand("nonexistent", []);

      expect(result).toBeFalsy();
    });

    it("returns false when status is null (signal termination)", () => {
      vi.mocked(spawnSync).mockReturnValue({ status: null, signal: "SIGTERM" } as any);

      const result = tryRunCommand("long-running", []);

      expect(result).toBeFalsy();
    });

    it("throws when binary is not found (ENOENT)", () => {
      vi.mocked(spawnSync).mockReturnValue({
        status: null,
        error: new Error("spawn npq ENOENT"),
      } as any);

      expect(() => tryRunCommand("npq", ["install", "lodash@4.17.21", "--dry-run"])).toThrow(
        'Failed to spawn "npq": spawn npq ENOENT',
      );
    });

    it("uses custom options when provided", () => {
      vi.mocked(spawnSync).mockReturnValue({ status: 0 } as any);

      const customOptions = { stdio: "pipe" as const, cwd: "/tmp" };
      tryRunCommand("npm", ["test"], customOptions);

      expect(spawnSync).toHaveBeenCalledWith("npm", ["test"], customOptions);
    });

    it("handles empty args array", () => {
      vi.mocked(spawnSync).mockReturnValue({ status: 0 } as any);

      const result = tryRunCommand("node", []);

      expect(spawnSync).toHaveBeenCalledWith(
        "node",
        [],
        { stdio: "inherit", shell: false }
      );
      expect(result).toBeTruthy();
    });

    it("handles command with multiple arguments", () => {
      vi.mocked(spawnSync).mockReturnValue({ status: 0 } as any);

      tryRunCommand("git", ["commit", "-m", "test message", "--no-verify"]);

      expect(spawnSync).toHaveBeenCalledWith(
        "git",
        ["commit", "-m", "test message", "--no-verify"],
        { stdio: "inherit", shell: false }
      );
    });

    it("handles commands with special characters in args", () => {
      vi.mocked(spawnSync).mockReturnValue({ status: 0 } as any);

      tryRunCommand("echo", ["hello world", "foo=bar", "--flag=value"]);

      expect(spawnSync).toHaveBeenCalledWith(
        "echo",
        ["hello world", "foo=bar", "--flag=value"],
        { stdio: "inherit", shell: false }
      );
    });
  });

  describe("runWithOutput()", () => {
    it("calls spawnSync with pipe stdio and encoding", () => {
      vi.mocked(spawnSync).mockReturnValue({ status: 0, stdout: "", stderr: "" } as any);

      runWithOutput("npm", ["--version"]);

      expect(spawnSync).toHaveBeenCalledWith(
        "npm",
        ["--version"],
        { stdio: "pipe", shell: false, encoding: "utf-8" }
      );
    });

    it("returns success: true when command exits with code 0", () => {
      vi.mocked(spawnSync).mockReturnValue({ status: 0, stdout: "1.0.0\n", stderr: "" } as any);

      const result = runWithOutput("npm", ["--version"]);

      expect(result.success).toBe(true);
    });

    it("returns success: false when command exits with non-zero code", () => {
      vi.mocked(spawnSync).mockReturnValue({ status: 1, stdout: "", stderr: "error" } as any);

      const result = runWithOutput("npm", ["bad-command"]);

      expect(result.success).toBe(false);
    });

    it("returns combined stdout and stderr as output", () => {
      vi.mocked(spawnSync).mockReturnValue({
        status: 1,
        stdout: "warning: something\n",
        stderr: "error: bad package\n",
      } as any);

      const result = runWithOutput("npq", ["install", "bad@1.0.0", "--dry-run"]);

      expect(result.output).toContain("warning: something");
      expect(result.output).toContain("error: bad package");
    });

    it("returns empty string when stdout and stderr are empty", () => {
      vi.mocked(spawnSync).mockReturnValue({ status: 0, stdout: "", stderr: "" } as any);

      const result = runWithOutput("npm", ["--version"]);

      expect(result.output).toBe("");
    });

    it("trims whitespace from output", () => {
      vi.mocked(spawnSync).mockReturnValue({
        status: 0,
        stdout: "  output line  \n",
        stderr: "",
      } as any);

      const result = runWithOutput("cmd", []);

      expect(result.output).toBe("output line");
    });

    it("handles null stdout and stderr gracefully", () => {
      vi.mocked(spawnSync).mockReturnValue({ status: 0, stdout: null, stderr: null } as any);

      const result = runWithOutput("cmd", []);

      expect(result.output).toBe("");
      expect(result.success).toBe(true);
    });

    it("throws when spawnSync returns an error (e.g. ENOENT)", () => {
      vi.mocked(spawnSync).mockReturnValue({
        status: null,
        stdout: null,
        stderr: null,
        error: new Error("spawn npq ENOENT"),
      } as any);

      expect(() => runWithOutput("npq", ["install", "lodash@4.17.21", "--dry-run"])).toThrow(
        'Failed to spawn "npq": spawn npq ENOENT'
      );
    });
  });
});
