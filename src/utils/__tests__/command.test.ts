import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("child_process", () => ({
  spawnSync: vi.fn(),
}));

import { tryRunCommand } from "../command";
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
});
