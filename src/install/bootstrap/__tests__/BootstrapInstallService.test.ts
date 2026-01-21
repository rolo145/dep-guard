import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockRunnerInstance = {
  run: vi.fn(),
};

const mockConfirmationInstance = {
  showHeader: vi.fn(),
  confirmRun: vi.fn(),
  showProgress: vi.fn(),
  showSuccess: vi.fn(),
  showFailure: vi.fn(),
};

vi.mock("../BootstrapInstallRunner", () => ({
  BootstrapInstallRunner: class {
    run = mockRunnerInstance.run;
  },
}));

vi.mock("../BootstrapInstallConfirmation", () => ({
  BootstrapInstallConfirmation: class {
    showHeader = mockConfirmationInstance.showHeader;
    confirmRun = mockConfirmationInstance.confirmRun;
    showProgress = mockConfirmationInstance.showProgress;
    showSuccess = mockConfirmationInstance.showSuccess;
    showFailure = mockConfirmationInstance.showFailure;
  },
}));

import { BootstrapInstallService } from "../BootstrapInstallService";
import type { IExecutionContext } from "../../../context/IExecutionContext";

describe("BootstrapInstallService", () => {
  let service: BootstrapInstallService;
  let mockExit: ReturnType<typeof vi.spyOn>;
  let mockSpinner: { succeed: ReturnType<typeof vi.fn>; fail: ReturnType<typeof vi.fn> };
  let mockContext: IExecutionContext;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSpinner = { succeed: vi.fn(), fail: vi.fn() };
    mockConfirmationInstance.showProgress.mockReturnValue(mockSpinner);

    mockExit = vi.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });

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

    service = new BootstrapInstallService(mockContext, false); // useNpmFallback = false
  });

  afterEach(() => {
    mockExit.mockRestore();
  });

  describe("run()", () => {
    it("shows header", async () => {
      mockConfirmationInstance.confirmRun.mockResolvedValue(false);

      await service.run();

      expect(mockConfirmationInstance.showHeader).toHaveBeenCalled();
    });

    it("prompts for confirmation", async () => {
      mockConfirmationInstance.confirmRun.mockResolvedValue(false);

      await service.run();

      expect(mockConfirmationInstance.confirmRun).toHaveBeenCalled();
    });

    it("returns null when user declines", async () => {
      mockConfirmationInstance.confirmRun.mockResolvedValue(false);

      const result = await service.run();

      expect(result).toBeNull();
      expect(mockRunnerInstance.run).not.toHaveBeenCalled();
    });

    it("runs install when user confirms", async () => {
      mockConfirmationInstance.confirmRun.mockResolvedValue(true);
      mockRunnerInstance.run.mockReturnValue({ success: true });

      await service.run();

      expect(mockRunnerInstance.run).toHaveBeenCalled();
    });

    it("shows install progress spinner", async () => {
      mockConfirmationInstance.confirmRun.mockResolvedValue(true);
      mockRunnerInstance.run.mockReturnValue({ success: true });

      await service.run();

      expect(mockConfirmationInstance.showProgress).toHaveBeenCalled();
    });

    it("shows success when installation succeeds", async () => {
      mockConfirmationInstance.confirmRun.mockResolvedValue(true);
      mockRunnerInstance.run.mockReturnValue({ success: true });

      await service.run();

      expect(mockConfirmationInstance.showSuccess).toHaveBeenCalledWith(mockSpinner);
    });

    it("returns true when installation succeeds", async () => {
      mockConfirmationInstance.confirmRun.mockResolvedValue(true);
      mockRunnerInstance.run.mockReturnValue({ success: true });

      const result = await service.run();

      expect(result).toBeTruthy();
    });

    it("shows failure when installation fails", async () => {
      mockConfirmationInstance.confirmRun.mockResolvedValue(true);
      mockRunnerInstance.run.mockReturnValue({ success: false });

      await expect(service.run()).rejects.toThrow();

      expect(mockConfirmationInstance.showFailure).toHaveBeenCalledWith(mockSpinner);
    });

    it("exits with code 1 when installation fails", async () => {
      mockConfirmationInstance.confirmRun.mockResolvedValue(true);
      mockRunnerInstance.run.mockReturnValue({ success: false });

      await expect(service.run()).rejects.toThrow("process.exit(1)");

      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it("does not show success/failure when user declines", async () => {
      mockConfirmationInstance.confirmRun.mockResolvedValue(false);

      await service.run();

      expect(mockConfirmationInstance.showSuccess).not.toHaveBeenCalled();
      expect(mockConfirmationInstance.showFailure).not.toHaveBeenCalled();
    });

    it("does not show progress spinner when user declines", async () => {
      mockConfirmationInstance.confirmRun.mockResolvedValue(false);

      await service.run();

      expect(mockConfirmationInstance.showProgress).not.toHaveBeenCalled();
    });
  });

  describe("with npm fallback", () => {
    beforeEach(() => {
      service = new BootstrapInstallService(mockContext, true); // useNpmFallback = true
    });

    it("creates service with npm fallback", async () => {
      mockConfirmationInstance.confirmRun.mockResolvedValue(true);
      mockRunnerInstance.run.mockReturnValue({ success: true });

      await service.run();

      // Service should work the same way, just with different runner/confirmation behavior
      expect(mockRunnerInstance.run).toHaveBeenCalled();
    });
  });
});
