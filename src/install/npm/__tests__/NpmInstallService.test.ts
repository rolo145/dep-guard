import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockRunnerInstance = {
  install: vi.fn(),
};

const mockConfirmationInstance = {
  showHeader: vi.fn(),
  showPackageList: vi.fn(),
  confirmInstall: vi.fn(),
  showInstallProgress: vi.fn(),
  showSuccess: vi.fn(),
  showFailure: vi.fn(),
};

vi.mock("../NpmInstallRunner", () => ({
  NpmInstallRunner: class {
    install = mockRunnerInstance.install;
  },
}));

vi.mock("../NpmInstallConfirmation", () => ({
  NpmInstallConfirmation: class {
    showHeader = mockConfirmationInstance.showHeader;
    showPackageList = mockConfirmationInstance.showPackageList;
    confirmInstall = mockConfirmationInstance.confirmInstall;
    showInstallProgress = mockConfirmationInstance.showInstallProgress;
    showSuccess = mockConfirmationInstance.showSuccess;
    showFailure = mockConfirmationInstance.showFailure;
  },
}));

import { NpmInstallService } from "../NpmInstallService";
import type { IExecutionContext } from "../../../context/IExecutionContext";

describe("NpmInstallService", () => {
  let service: NpmInstallService;
  let mockContext: IExecutionContext;
  let mockExit: ReturnType<typeof vi.spyOn>;
  let mockSpinner: { succeed: ReturnType<typeof vi.fn>; fail: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
      cutoff: new Date(),
      cutoffIso: new Date().toISOString(),
      days: 7,
      allDependencies: {},
      dependencies: {},
      devDependencies: {},
      scripts: {},
      scriptNames: { lint: "lint", typecheck: "typecheck", test: "test", build: "build" },
      raw: {},
      hasScript: vi.fn(),
      hasPackage: vi.fn(),
      getPackageVersion: vi.fn(),
    };

    mockSpinner = { succeed: vi.fn(), fail: vi.fn() };
    mockConfirmationInstance.showInstallProgress.mockReturnValue(mockSpinner);

    mockExit = vi.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });

    service = new NpmInstallService(mockContext);
  });

  afterEach(() => {
    mockExit.mockRestore();
  });

  describe("install()", () => {
    it("shows header", async () => {
      mockConfirmationInstance.confirmInstall.mockResolvedValue(false);

      await service.install([{ name: "chalk", version: "5.0.0" }]);

      expect(mockConfirmationInstance.showHeader).toHaveBeenCalled();
    });

    it("shows package list with formatted specs", async () => {
      mockConfirmationInstance.confirmInstall.mockResolvedValue(false);

      await service.install([
        { name: "chalk", version: "5.0.0" },
        { name: "lodash", version: "4.17.21" },
      ]);

      expect(mockConfirmationInstance.showPackageList).toHaveBeenCalledWith([
        "chalk@5.0.0",
        "lodash@4.17.21",
      ]);
    });

    it("prompts for confirmation", async () => {
      mockConfirmationInstance.confirmInstall.mockResolvedValue(false);

      await service.install([{ name: "chalk", version: "5.0.0" }]);

      expect(mockConfirmationInstance.confirmInstall).toHaveBeenCalled();
    });

    it("returns false when user declines", async () => {
      mockConfirmationInstance.confirmInstall.mockResolvedValue(false);

      const result = await service.install([{ name: "chalk", version: "5.0.0" }]);

      expect(result).toBeFalsy();
      expect(mockRunnerInstance.install).not.toHaveBeenCalled();
    });

    it("runs npm install when user confirms", async () => {
      mockConfirmationInstance.confirmInstall.mockResolvedValue(true);
      mockRunnerInstance.install.mockReturnValue({ success: true, packageSpecs: ["chalk@5.0.0"] });

      await service.install([{ name: "chalk", version: "5.0.0" }]);

      expect(mockRunnerInstance.install).toHaveBeenCalledWith(["chalk@5.0.0"]);
    });

    it("shows install progress spinner", async () => {
      mockConfirmationInstance.confirmInstall.mockResolvedValue(true);
      mockRunnerInstance.install.mockReturnValue({ success: true, packageSpecs: [] });

      await service.install([{ name: "chalk", version: "5.0.0" }]);

      expect(mockConfirmationInstance.showInstallProgress).toHaveBeenCalled();
    });

    it("shows success when installation succeeds", async () => {
      mockConfirmationInstance.confirmInstall.mockResolvedValue(true);
      mockRunnerInstance.install.mockReturnValue({ success: true, packageSpecs: [] });

      await service.install([{ name: "chalk", version: "5.0.0" }]);

      expect(mockConfirmationInstance.showSuccess).toHaveBeenCalledWith(mockSpinner);
    });

    it("returns true when installation succeeds", async () => {
      mockConfirmationInstance.confirmInstall.mockResolvedValue(true);
      mockRunnerInstance.install.mockReturnValue({ success: true, packageSpecs: [] });

      const result = await service.install([{ name: "chalk", version: "5.0.0" }]);

      expect(result).toBeTruthy();
    });

    it("shows failure when installation fails", async () => {
      mockConfirmationInstance.confirmInstall.mockResolvedValue(true);
      mockRunnerInstance.install.mockReturnValue({ success: false, packageSpecs: [] });

      await expect(service.install([{ name: "chalk", version: "5.0.0" }])).rejects.toThrow();

      expect(mockConfirmationInstance.showFailure).toHaveBeenCalledWith(mockSpinner);
    });

    it("exits with code 1 when installation fails", async () => {
      mockConfirmationInstance.confirmInstall.mockResolvedValue(true);
      mockRunnerInstance.install.mockReturnValue({ success: false, packageSpecs: [] });

      await expect(service.install([{ name: "chalk", version: "5.0.0" }])).rejects.toThrow(
        "process.exit(1)"
      );

      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe("installSingle()", () => {
    it("delegates to install with single package array", async () => {
      mockConfirmationInstance.confirmInstall.mockResolvedValue(true);
      mockRunnerInstance.install.mockReturnValue({ success: true, packageSpecs: [] });

      await service.installSingle("chalk", "5.0.0");

      expect(mockConfirmationInstance.showPackageList).toHaveBeenCalledWith(["chalk@5.0.0"]);
    });

    it("returns result from install", async () => {
      mockConfirmationInstance.confirmInstall.mockResolvedValue(true);
      mockRunnerInstance.install.mockReturnValue({ success: true, packageSpecs: [] });

      const result = await service.installSingle("chalk", "5.0.0");

      expect(result).toBeTruthy();
    });
  });
});
