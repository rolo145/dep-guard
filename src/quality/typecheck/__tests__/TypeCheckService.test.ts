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

vi.mock("../TypeCheckRunner", () => ({
  TypeCheckRunner: class {
    run = mockRunner.run;
  },
}));

vi.mock("../TypeCheckConfirmation", () => ({
  TypeCheckConfirmation: class {
    showHeader = mockConfirmation.showHeader;
    showScriptName = mockConfirmation.showScriptName;
    showScriptNotFound = mockConfirmation.showScriptNotFound;
    confirmRun = mockConfirmation.confirmRun;
    showProgress = mockConfirmation.showProgress;
    showSuccess = mockConfirmation.showSuccess;
    showFailure = mockConfirmation.showFailure;
  },
}));

import { TypeCheckService } from "../TypeCheckService";
import type { IExecutionContext } from "../../../context/IExecutionContext";

describe("TypeCheckService", () => {
  let service: TypeCheckService;
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

    service = new TypeCheckService(mockContext);
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

      expect(mockConfirmation.showScriptNotFound).toHaveBeenCalledWith("typecheck");
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

      expect(mockConfirmation.showScriptName).toHaveBeenCalledWith("typecheck");
    });

    it("returns null when user declines", async () => {
      (mockContext.hasScript as ReturnType<typeof vi.fn>).mockReturnValue(true);
      mockConfirmation.confirmRun.mockResolvedValue(false);

      const result = await service.run();

      expect(result).toBeNull();
    });

    it("runs type check when user confirms", async () => {
      (mockContext.hasScript as ReturnType<typeof vi.fn>).mockReturnValue(true);
      mockConfirmation.confirmRun.mockResolvedValue(true);
      mockRunner.run.mockReturnValue({ scriptName: "typecheck", success: true });

      await service.run();

      expect(mockRunner.run).toHaveBeenCalledWith("typecheck");
    });

    it("shows progress spinner when running", async () => {
      (mockContext.hasScript as ReturnType<typeof vi.fn>).mockReturnValue(true);
      mockConfirmation.confirmRun.mockResolvedValue(true);
      mockRunner.run.mockReturnValue({ scriptName: "typecheck", success: true });

      await service.run();

      expect(mockConfirmation.showProgress).toHaveBeenCalled();
    });

    it("returns true when type check passes", async () => {
      (mockContext.hasScript as ReturnType<typeof vi.fn>).mockReturnValue(true);
      mockConfirmation.confirmRun.mockResolvedValue(true);
      mockRunner.run.mockReturnValue({ scriptName: "typecheck", success: true });

      const result = await service.run();

      expect(result).toBeTruthy();
    });

    it("shows success when type check passes", async () => {
      (mockContext.hasScript as ReturnType<typeof vi.fn>).mockReturnValue(true);
      mockConfirmation.confirmRun.mockResolvedValue(true);
      mockRunner.run.mockReturnValue({ scriptName: "typecheck", success: true });

      await service.run();

      expect(mockConfirmation.showSuccess).toHaveBeenCalledWith(mockSpinner);
    });

    it("returns false when type check fails", async () => {
      (mockContext.hasScript as ReturnType<typeof vi.fn>).mockReturnValue(true);
      mockConfirmation.confirmRun.mockResolvedValue(true);
      mockRunner.run.mockReturnValue({ scriptName: "typecheck", success: false });

      const result = await service.run();

      expect(result).toBeFalsy();
    });

    it("shows failure when type check fails", async () => {
      (mockContext.hasScript as ReturnType<typeof vi.fn>).mockReturnValue(true);
      mockConfirmation.confirmRun.mockResolvedValue(true);
      mockRunner.run.mockReturnValue({ scriptName: "typecheck", success: false });

      await service.run();

      expect(mockConfirmation.showFailure).toHaveBeenCalledWith(mockSpinner);
    });

    it("uses custom script name from context", async () => {
      mockContext.scriptNames.typecheck = "custom-typecheck";
      (mockContext.hasScript as ReturnType<typeof vi.fn>).mockReturnValue(true);
      mockConfirmation.confirmRun.mockResolvedValue(true);
      mockRunner.run.mockReturnValue({ scriptName: "custom-typecheck", success: true });

      await service.run();

      expect(mockRunner.run).toHaveBeenCalledWith("custom-typecheck");
    });
  });
});
