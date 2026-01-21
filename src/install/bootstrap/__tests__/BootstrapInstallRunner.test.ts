import { describe, it, expect, vi, beforeEach } from "vitest";
import { BootstrapInstallRunner } from "../BootstrapInstallRunner";
import type { IExecutionContext } from "../../../context/IExecutionContext";

// Mock the command utility
vi.mock("../../../utils/command", () => ({
  tryRunCommand: vi.fn(),
}));

import { tryRunCommand } from "../../../utils/command";

describe("BootstrapInstallRunner", () => {
  let mockContext: IExecutionContext;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock context with test cutoff date
    const testCutoff = new Date("2024-01-15");
    mockContext = {
      days: 7,
      cutoff: testCutoff,
      cutoffIso: testCutoff.toISOString(),
      scriptNames: {
        lint: "lint",
        typecheck: "typecheck",
        test: "test",
        build: "build",
      },
      scripts: {},
      allDependencies: {},
      dependencies: {},
      devDependencies: {},
      raw: { name: "test", version: "1.0.0" },
      hasScript: vi.fn(),
      hasPackage: vi.fn(),
      getPackageVersion: vi.fn(),
    };
  });

  describe("run() with scfw", () => {
    let runner: BootstrapInstallRunner;

    beforeEach(() => {
      runner = new BootstrapInstallRunner(mockContext, false); // useNpmFallback = false
    });

    it("executes scfw run npm install with --ignore-scripts and --before flags", () => {
      vi.mocked(tryRunCommand).mockReturnValue(true);

      runner.run();

      expect(tryRunCommand).toHaveBeenCalledWith("scfw", [
        "run",
        "npm",
        "install",
        "--ignore-scripts",
        "--before",
        mockContext.cutoffIso,
      ]);
    });

    it("returns success: true when scfw command succeeds", () => {
      vi.mocked(tryRunCommand).mockReturnValue(true);

      const result = runner.run();

      expect(result.success).toBeTruthy();
    });

    it("returns success: false when scfw command fails", () => {
      vi.mocked(tryRunCommand).mockReturnValue(false);

      const result = runner.run();

      expect(result.success).toBeFalsy();
    });
  });

  describe("run() with npm fallback", () => {
    let runner: BootstrapInstallRunner;

    beforeEach(() => {
      runner = new BootstrapInstallRunner(mockContext, true); // useNpmFallback = true
    });

    it("executes npm install with --ignore-scripts and --before flags", () => {
      vi.mocked(tryRunCommand).mockReturnValue(true);

      runner.run();

      expect(tryRunCommand).toHaveBeenCalledWith("npm", [
        "install",
        "--ignore-scripts",
        "--before",
        mockContext.cutoffIso,
      ]);
    });

    it("returns success: true when npm command succeeds", () => {
      vi.mocked(tryRunCommand).mockReturnValue(true);

      const result = runner.run();

      expect(result.success).toBeTruthy();
    });

    it("returns success: false when npm command fails", () => {
      vi.mocked(tryRunCommand).mockReturnValue(false);

      const result = runner.run();

      expect(result.success).toBeFalsy();
    });

    it("does not call scfw when using npm fallback", () => {
      vi.mocked(tryRunCommand).mockReturnValue(true);

      runner.run();

      expect(tryRunCommand).not.toHaveBeenCalledWith("scfw", expect.anything());
    });
  });
});
