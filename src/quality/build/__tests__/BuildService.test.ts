import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRunner = {
  run: vi.fn(),
};

const mockSpinner = {
  succeed: vi.fn(),
  fail: vi.fn(),
};

const mockConfirmation = {
  showHeader: vi.fn(),
  showScriptName: vi.fn(),
  showScriptNotFound: vi.fn(),
  confirmRun: vi.fn(),
  showProgress: vi.fn(() => mockSpinner),
  showSuccess: vi.fn(),
  showFailure: vi.fn(),
};

vi.mock("../BuildRunner", () => ({
  BuildRunner: class {
    run = mockRunner.run;
  },
}));

vi.mock("../BuildConfirmation", () => ({
  BuildConfirmation: class {
    showHeader = mockConfirmation.showHeader;
    showScriptName = mockConfirmation.showScriptName;
    showScriptNotFound = mockConfirmation.showScriptNotFound;
    confirmRun = mockConfirmation.confirmRun;
    showProgress = mockConfirmation.showProgress;
    showSuccess = mockConfirmation.showSuccess;
    showFailure = mockConfirmation.showFailure;
  },
}));

import { BuildService } from "../BuildService";
import type { IExecutionContext } from "../../../context/IExecutionContext";

describe("BuildService", () => {
  let service: BuildService;
  let mockContext: IExecutionContext;

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

    service = new BuildService(mockContext);
  });

  describe("run()", () => {
    it("returns null when script not found", async () => {
      (mockContext.hasScript as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const result = await service.run();

      expect(result).toBeNull();
    });

    it("shows script not found message when script missing", async () => {
      (mockContext.hasScript as ReturnType<typeof vi.fn>).mockReturnValue(false);

      await service.run();

      expect(mockConfirmation.showScriptNotFound).toHaveBeenCalledWith("build");
    });

    it("shows header when script exists", async () => {
      (mockContext.hasScript as ReturnType<typeof vi.fn>).mockReturnValue(true);
      mockConfirmation.confirmRun.mockResolvedValue(false);

      await service.run();

      expect(mockConfirmation.showHeader).toHaveBeenCalled();
    });

    it("shows script name when script exists", async () => {
      (mockContext.hasScript as ReturnType<typeof vi.fn>).mockReturnValue(true);
      mockConfirmation.confirmRun.mockResolvedValue(false);

      await service.run();

      expect(mockConfirmation.showScriptName).toHaveBeenCalledWith("build");
    });

    it("returns null when user declines", async () => {
      (mockContext.hasScript as ReturnType<typeof vi.fn>).mockReturnValue(true);
      mockConfirmation.confirmRun.mockResolvedValue(false);

      const result = await service.run();

      expect(result).toBeNull();
    });

    it("runs build when user confirms", async () => {
      (mockContext.hasScript as ReturnType<typeof vi.fn>).mockReturnValue(true);
      mockConfirmation.confirmRun.mockResolvedValue(true);
      mockRunner.run.mockReturnValue({ scriptName: "build", success: true });

      await service.run();

      expect(mockRunner.run).toHaveBeenCalledWith("build");
    });

    it("shows progress spinner when running", async () => {
      (mockContext.hasScript as ReturnType<typeof vi.fn>).mockReturnValue(true);
      mockConfirmation.confirmRun.mockResolvedValue(true);
      mockRunner.run.mockReturnValue({ scriptName: "build", success: true });

      await service.run();

      expect(mockConfirmation.showProgress).toHaveBeenCalled();
    });

    it("returns true when build passes", async () => {
      (mockContext.hasScript as ReturnType<typeof vi.fn>).mockReturnValue(true);
      mockConfirmation.confirmRun.mockResolvedValue(true);
      mockRunner.run.mockReturnValue({ scriptName: "build", success: true });

      const result = await service.run();

      expect(result).toBe(true);
    });

    it("shows success when build passes", async () => {
      (mockContext.hasScript as ReturnType<typeof vi.fn>).mockReturnValue(true);
      mockConfirmation.confirmRun.mockResolvedValue(true);
      mockRunner.run.mockReturnValue({ scriptName: "build", success: true });

      await service.run();

      expect(mockConfirmation.showSuccess).toHaveBeenCalledWith(mockSpinner);
    });

    it("returns false when build fails", async () => {
      (mockContext.hasScript as ReturnType<typeof vi.fn>).mockReturnValue(true);
      mockConfirmation.confirmRun.mockResolvedValue(true);
      mockRunner.run.mockReturnValue({ scriptName: "build", success: false });

      const result = await service.run();

      expect(result).toBe(false);
    });

    it("shows failure when build fails", async () => {
      (mockContext.hasScript as ReturnType<typeof vi.fn>).mockReturnValue(true);
      mockConfirmation.confirmRun.mockResolvedValue(true);
      mockRunner.run.mockReturnValue({ scriptName: "build", success: false });

      await service.run();

      expect(mockConfirmation.showFailure).toHaveBeenCalledWith(mockSpinner);
    });

    it("uses custom script name from context", async () => {
      mockContext.scriptNames.build = "custom-build";
      (mockContext.hasScript as ReturnType<typeof vi.fn>).mockReturnValue(true);
      mockConfirmation.confirmRun.mockResolvedValue(true);
      mockRunner.run.mockReturnValue({ scriptName: "custom-build", success: true });

      await service.run();

      expect(mockRunner.run).toHaveBeenCalledWith("custom-build");
    });
  });
});
