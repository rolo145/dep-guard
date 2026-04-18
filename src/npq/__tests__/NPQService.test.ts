import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRunnerInstance = {
  checkCapturingOutput: vi.fn(),
  checkBatch: vi.fn(),
};

const mockConfirmationInstance = {
  displayResult: vi.fn(),
  confirm: vi.fn(),
  showPackageHeader: vi.fn(),
  showCheckStarted: vi.fn(),
};

vi.mock("../NPQRunner", () => ({
  NPQRunner: class {
    checkCapturingOutput = mockRunnerInstance.checkCapturingOutput;
    checkBatch = mockRunnerInstance.checkBatch;
  },
}));

vi.mock("../NPQConfirmation", () => ({
  NPQConfirmation: class {
    displayResult = mockConfirmationInstance.displayResult;
    confirm = mockConfirmationInstance.confirm;
    showPackageHeader = mockConfirmationInstance.showPackageHeader;
    showCheckStarted = mockConfirmationInstance.showCheckStarted;
  },
}));

import { NPQService } from "../NPQService";
import type { IExecutionContext } from "../../context/IExecutionContext";

describe("NPQService", () => {
  let service: NPQService;
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

    service = new NPQService(mockContext);
  });

  describe("runSecurityCheck()", () => {
    it("shows check started message", () => {
      mockRunnerInstance.checkCapturingOutput.mockReturnValue({ packageSpec: "lodash@5.0.0", passed: true, outputLines: [] });

      service.runSecurityCheck("lodash@5.0.0");

      expect(mockConfirmationInstance.showCheckStarted).toHaveBeenCalledWith("lodash@5.0.0");
    });

    it("runs NPQ check via checkCapturingOutput", () => {
      mockRunnerInstance.checkCapturingOutput.mockReturnValue({ packageSpec: "lodash@5.0.0", passed: true, outputLines: [] });

      service.runSecurityCheck("lodash@5.0.0");

      expect(mockRunnerInstance.checkCapturingOutput).toHaveBeenCalledWith("lodash@5.0.0");
    });

    it("displays result", () => {
      mockRunnerInstance.checkCapturingOutput.mockReturnValue({ packageSpec: "lodash@5.0.0", passed: true, outputLines: [] });

      service.runSecurityCheck("lodash@5.0.0");

      expect(mockConfirmationInstance.displayResult).toHaveBeenCalledWith("lodash@5.0.0", true);
    });

    it("returns true when check passes", () => {
      mockRunnerInstance.checkCapturingOutput.mockReturnValue({ packageSpec: "lodash@5.0.0", passed: true, outputLines: [] });

      const result = service.runSecurityCheck("lodash@5.0.0");

      expect(result).toBeTruthy();
    });

    it("returns false when check fails", () => {
      mockRunnerInstance.checkCapturingOutput.mockReturnValue({ packageSpec: "malicious@1.0.0", passed: false, outputLines: ["Supply Chain Security - Malware detected"] });

      const result = service.runSecurityCheck("malicious@1.0.0");

      expect(result).toBeFalsy();
    });

    it("prints captured issue lines to console", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      mockRunnerInstance.checkCapturingOutput.mockReturnValue({
        packageSpec: "pkg@1.0.0",
        passed: false,
        outputLines: ["Supply Chain Security - No provenance", "Package Health - Old package"],
      });

      service.runSecurityCheck("pkg@1.0.0");

      expect(consoleSpy).toHaveBeenCalledWith("  Supply Chain Security - No provenance");
      expect(consoleSpy).toHaveBeenCalledWith("  Package Health - Old package");
      consoleSpy.mockRestore();
    });

    it("does not print anything when there are no issues", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      mockRunnerInstance.checkCapturingOutput.mockReturnValue({ packageSpec: "safe@1.0.0", passed: true, outputLines: [] });

      service.runSecurityCheck("safe@1.0.0");

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("validateAndConfirm()", () => {
    it("shows package header", async () => {
      mockRunnerInstance.checkCapturingOutput.mockReturnValue({ packageSpec: "lodash@5.0.0", passed: true, outputLines: [] });
      mockConfirmationInstance.confirm.mockResolvedValue(true);

      await service.validateAndConfirm("lodash", "5.0.0");

      expect(mockConfirmationInstance.showPackageHeader).toHaveBeenCalledWith("lodash@5.0.0");
    });

    it("runs security check with correct package spec", async () => {
      mockRunnerInstance.checkCapturingOutput.mockReturnValue({ packageSpec: "lodash@5.0.0", passed: true, outputLines: [] });
      mockConfirmationInstance.confirm.mockResolvedValue(true);

      await service.validateAndConfirm("lodash", "5.0.0");

      expect(mockRunnerInstance.checkCapturingOutput).toHaveBeenCalledWith("lodash@5.0.0");
    });

    it("passes NPQ result to confirmation", async () => {
      mockRunnerInstance.checkCapturingOutput.mockReturnValue({ packageSpec: "lodash@5.0.0", passed: true, outputLines: [] });
      mockConfirmationInstance.confirm.mockResolvedValue(true);

      await service.validateAndConfirm("lodash", "5.0.0");

      expect(mockConfirmationInstance.confirm).toHaveBeenCalledWith("lodash@5.0.0", true);
    });

    it("returns true when user confirms", async () => {
      mockRunnerInstance.checkCapturingOutput.mockReturnValue({ packageSpec: "lodash@5.0.0", passed: true, outputLines: [] });
      mockConfirmationInstance.confirm.mockResolvedValue(true);

      const result = await service.validateAndConfirm("lodash", "5.0.0");

      expect(result).toBeTruthy();
    });

    it("returns false when user declines", async () => {
      mockRunnerInstance.checkCapturingOutput.mockReturnValue({ packageSpec: "lodash@5.0.0", passed: true, outputLines: [] });
      mockConfirmationInstance.confirm.mockResolvedValue(false);

      const result = await service.validateAndConfirm("lodash", "5.0.0");

      expect(result).toBeFalsy();
    });
  });

  describe("processSelection()", () => {
    it("processes each selected package", async () => {
      mockRunnerInstance.checkCapturingOutput.mockReturnValue({ packageSpec: "test", passed: true, outputLines: [] });
      mockConfirmationInstance.confirm.mockResolvedValue(true);

      await service.processSelection([
        { name: "lodash", version: "5.0.0" },
        { name: "express", version: "4.19.0" },
      ]);

      expect(mockConfirmationInstance.showPackageHeader).toHaveBeenCalledTimes(2);
    });

    it("returns confirmed packages", async () => {
      mockRunnerInstance.checkCapturingOutput.mockReturnValue({ packageSpec: "test", passed: true, outputLines: [] });
      mockConfirmationInstance.confirm
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const result = await service.processSelection([
        { name: "lodash", version: "5.0.0" },
        { name: "express", version: "4.19.0" },
      ]);

      expect(result).toStrictEqual([{ name: "lodash", version: "5.0.0" }]);
    });

    it("returns empty array when no packages confirmed", async () => {
      mockRunnerInstance.checkCapturingOutput.mockReturnValue({ packageSpec: "test", passed: false, outputLines: [] });
      mockConfirmationInstance.confirm.mockResolvedValue(false);

      const result = await service.processSelection([
        { name: "lodash", version: "5.0.0" },
      ]);

      expect(result).toStrictEqual([]);
    });

    it("returns empty array for empty selection", async () => {
      const result = await service.processSelection([]);

      expect(result).toStrictEqual([]);
      expect(mockRunnerInstance.checkCapturingOutput).not.toHaveBeenCalled();
    });

    it("processes packages in order", async () => {
      mockRunnerInstance.checkCapturingOutput.mockReturnValue({ packageSpec: "test", passed: true, outputLines: [] });
      mockConfirmationInstance.confirm.mockResolvedValue(true);

      const packages = [
        { name: "a", version: "1.0.0" },
        { name: "b", version: "2.0.0" },
        { name: "c", version: "3.0.0" },
      ];

      const result = await service.processSelection(packages);

      expect(result).toStrictEqual(packages);
    });

    it("includes package even if NPQ fails but user confirms", async () => {
      mockRunnerInstance.checkCapturingOutput.mockReturnValue({ packageSpec: "test", passed: false, outputLines: ["Supply Chain Security - Malware detected"] });
      mockConfirmationInstance.confirm.mockResolvedValue(true);

      const result = await service.processSelection([
        { name: "risky-pkg", version: "1.0.0" },
      ]);

      expect(result).toStrictEqual([{ name: "risky-pkg", version: "1.0.0" }]);
    });
  });
});
