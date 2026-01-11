import { describe, it, expect, vi, beforeEach } from "vitest";
import { InstallService } from "../InstallService";
import { ExecutionContextFactory } from "../../context/ExecutionContextFactory";

const mockRunnerRun = vi.fn();
const mockRunnerRunSCFW = vi.fn();
const mockRunnerRunCI = vi.fn();

// Mock InstallRunner
vi.mock("../InstallRunner", () => ({
  InstallRunner: class {
    run = mockRunnerRun;
    runSCFW = mockRunnerRunSCFW;
    runCI = mockRunnerRunCI;
  },
}));

// Mock InstallConfirmation
vi.mock("../InstallConfirmation", () => ({
  InstallConfirmation: class {},
}));

describe("InstallService", () => {
  const mockContext = ExecutionContextFactory.createMock();
  let service: InstallService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new InstallService(mockContext);
  });

  describe("run()", () => {
    it("returns true when CI succeeds and no packages provided", async () => {
      mockRunnerRun.mockResolvedValue({ ciSuccess: true, scfwSuccess: false });

      const result = await service.run();

      expect(result).toBeTruthy();
    });

    it("returns true when CI is skipped (null) and no packages provided", async () => {
      mockRunnerRun.mockResolvedValue({ ciSuccess: null, scfwSuccess: false });

      const result = await service.run();

      expect(result).toBeTruthy();
    });

    it("returns true when both SCFW and CI succeed", async () => {
      mockRunnerRun.mockResolvedValue({ ciSuccess: true, scfwSuccess: true });

      const packages = [{ name: "chalk", version: "5.0.0" }];
      const result = await service.run(packages);

      expect(mockRunnerRun).toHaveBeenCalledWith(packages);
      expect(result).toBeTruthy();
    });

    it("returns false when SCFW fails with packages", async () => {
      mockRunnerRun.mockResolvedValue({ ciSuccess: true, scfwSuccess: false });

      const packages = [{ name: "chalk", version: "5.0.0" }];
      const result = await service.run(packages);

      expect(result).toBeFalsy();
    });

    it("returns true when packages array is empty and CI succeeds", async () => {
      mockRunnerRun.mockResolvedValue({ ciSuccess: true, scfwSuccess: false });

      const result = await service.run([]);

      expect(result).toBeTruthy();
    });

    it("returns false when CI fails", async () => {
      mockRunnerRun.mockResolvedValue({ ciSuccess: false, scfwSuccess: true });

      const result = await service.run();

      expect(result).toBeFalsy();
    });
  });

  describe("installPackages()", () => {
    it("delegates to runner.runSCFW", async () => {
      mockRunnerRunSCFW.mockResolvedValue(true);

      const packages = [{ name: "chalk", version: "5.0.0" }];
      const result = await service.installPackages(packages);

      expect(mockRunnerRunSCFW).toHaveBeenCalledWith(packages);
      expect(result).toBeTruthy();
    });

    it("returns false when SCFW fails", async () => {
      mockRunnerRunSCFW.mockResolvedValue(false);

      const packages = [{ name: "chalk", version: "5.0.0" }];
      const result = await service.installPackages(packages);

      expect(result).toBeFalsy();
    });
  });

  describe("reinstall()", () => {
    it("delegates to runner.runCI", async () => {
      mockRunnerRunCI.mockResolvedValue(true);

      const result = await service.reinstall();

      expect(mockRunnerRunCI).toHaveBeenCalled();
      expect(result).toBeTruthy();
    });

    it("returns null when skipped", async () => {
      mockRunnerRunCI.mockResolvedValue(null);

      const result = await service.reinstall();

      expect(result).toBeNull();
    });

    it("returns false when CI fails", async () => {
      mockRunnerRunCI.mockResolvedValue(false);

      const result = await service.reinstall();

      expect(result).toBeFalsy();
    });
  });
});
