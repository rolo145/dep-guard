import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../logger", () => ({
  logger: {
    header: vi.fn(),
    info: vi.fn(),
    skip: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    spinner: vi.fn(() => ({
      succeed: vi.fn(),
      fail: vi.fn(),
    })),
  },
}));

vi.mock("@inquirer/prompts", () => ({
  confirm: vi.fn(),
}));

vi.mock("../../../errors", () => ({
  withCancellationHandling: vi.fn((fn) => fn()),
}));

import { BootstrapInstallConfirmation } from "../BootstrapInstallConfirmation";
import { logger } from "../../../logger";
import { confirm } from "@inquirer/prompts";
import type { IExecutionContext } from "../../../context/IExecutionContext";

describe("BootstrapInstallConfirmation", () => {
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

  describe("showHeader() with scfw", () => {
    let confirmation: BootstrapInstallConfirmation;

    beforeEach(() => {
      confirmation = new BootstrapInstallConfirmation(mockContext, false); // useNpmFallback = false
    });

    it("displays header with fresh install message", () => {
      confirmation.showHeader();

      expect(logger.header).toHaveBeenCalledWith("Fresh install from package.json", "📦");
    });

    it("shows scfw method with --before flag", () => {
      confirmation.showHeader();

      expect(logger.info).toHaveBeenCalledWith(
        "This will run 'scfw run npm install --ignore-scripts --before <date>' to:"
      );
    });

    it("explains what fresh install does", () => {
      confirmation.showHeader();

      expect(logger.info).toHaveBeenCalledWith("  • Install all dependencies from package.json");
      expect(logger.info).toHaveBeenCalledWith("  • Regenerate package-lock.json");
    });

    it("shows safety buffer information", () => {
      confirmation.showHeader();

      const cutoffDate = mockContext.cutoff.toLocaleDateString();
      expect(logger.info).toHaveBeenCalledWith(
        `  • Only install versions published before ${cutoffDate} (7 day safety buffer)`
      );
    });
  });

  describe("showHeader() with npm fallback", () => {
    let confirmation: BootstrapInstallConfirmation;

    beforeEach(() => {
      confirmation = new BootstrapInstallConfirmation(mockContext, true); // useNpmFallback = true
    });

    it("displays header with fresh install message", () => {
      confirmation.showHeader();

      expect(logger.header).toHaveBeenCalledWith("Fresh install from package.json", "📦");
    });

    it("shows npm method with --before flag", () => {
      confirmation.showHeader();

      expect(logger.info).toHaveBeenCalledWith(
        "This will run 'npm install --ignore-scripts --before <date>' to:"
      );
    });

    it("explains what fresh install does", () => {
      confirmation.showHeader();

      expect(logger.info).toHaveBeenCalledWith("  • Install all dependencies from package.json");
      expect(logger.info).toHaveBeenCalledWith("  • Regenerate package-lock.json");
    });

    it("shows safety buffer information", () => {
      confirmation.showHeader();

      const cutoffDate = mockContext.cutoff.toLocaleDateString();
      expect(logger.info).toHaveBeenCalledWith(
        `  • Only install versions published before ${cutoffDate} (7 day safety buffer)`
      );
    });
  });

  describe("confirmRun()", () => {
    let confirmation: BootstrapInstallConfirmation;

    beforeEach(() => {
      confirmation = new BootstrapInstallConfirmation(mockContext, false);
    });

    it("prompts user with correct message", async () => {
      vi.mocked(confirm).mockResolvedValue(true);

      await confirmation.confirmRun();

      expect(confirm).toHaveBeenCalledWith({
        message: "Do you want to proceed with fresh install?",
        default: true,
      });
    });

    it("returns true when user confirms", async () => {
      vi.mocked(confirm).mockResolvedValue(true);

      const result = await confirmation.confirmRun();

      expect(result).toBeTruthy();
    });

    it("returns false when user declines", async () => {
      vi.mocked(confirm).mockResolvedValue(false);

      const result = await confirmation.confirmRun();

      expect(result).toBeFalsy();
    });

    it("logs skip message when user declines", async () => {
      vi.mocked(confirm).mockResolvedValue(false);

      await confirmation.confirmRun();

      expect(logger.skip).toHaveBeenCalledWith("Skipping fresh install");
    });

    it("does not log skip message when user confirms", async () => {
      vi.mocked(confirm).mockResolvedValue(true);

      await confirmation.confirmRun();

      expect(logger.skip).not.toHaveBeenCalled();
    });
  });

  describe("showProgress() with scfw", () => {
    let confirmation: BootstrapInstallConfirmation;

    beforeEach(() => {
      confirmation = new BootstrapInstallConfirmation(mockContext, false);
    });

    it("creates spinner with scfw message", () => {
      confirmation.showProgress();

      expect(logger.spinner).toHaveBeenCalledWith("Installing dependencies via scfw...");
    });

    it("returns spinner instance", () => {
      const spinner = confirmation.showProgress();

      expect(spinner).toBeDefined();
      expect(spinner.succeed).toBeDefined();
      expect(spinner.fail).toBeDefined();
    });
  });

  describe("showProgress() with npm fallback", () => {
    let confirmation: BootstrapInstallConfirmation;

    beforeEach(() => {
      confirmation = new BootstrapInstallConfirmation(mockContext, true);
    });

    it("creates spinner with npm message", () => {
      confirmation.showProgress();

      expect(logger.spinner).toHaveBeenCalledWith("Installing dependencies via npm...");
    });
  });

  describe("showSuccess()", () => {
    let confirmation: BootstrapInstallConfirmation;

    beforeEach(() => {
      confirmation = new BootstrapInstallConfirmation(mockContext, false);
    });

    it("calls spinner succeed with success message", () => {
      const mockSpinner = { succeed: vi.fn(), fail: vi.fn() };

      confirmation.showSuccess(mockSpinner as any);

      expect(mockSpinner.succeed).toHaveBeenCalledWith("Dependencies installed successfully");
    });

    it("logs success message", () => {
      const mockSpinner = { succeed: vi.fn(), fail: vi.fn() };

      confirmation.showSuccess(mockSpinner as any);

      expect(logger.success).toHaveBeenCalledWith("Fresh install complete!");
    });
  });

  describe("showFailure()", () => {
    let confirmation: BootstrapInstallConfirmation;

    beforeEach(() => {
      confirmation = new BootstrapInstallConfirmation(mockContext, false);
    });

    it("calls spinner fail with failure message", () => {
      const mockSpinner = { succeed: vi.fn(), fail: vi.fn() };

      confirmation.showFailure(mockSpinner as any);

      expect(mockSpinner.fail).toHaveBeenCalledWith("Failed to install dependencies");
    });

    it("logs error message", () => {
      const mockSpinner = { succeed: vi.fn(), fail: vi.fn() };

      confirmation.showFailure(mockSpinner as any);

      expect(logger.error).toHaveBeenCalledWith("Install process aborted");
    });
  });
});
