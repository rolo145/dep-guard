import { describe, it, expect, vi, beforeEach } from "vitest";
import { InstallRunner } from "../InstallRunner";
import { ExecutionContextFactory } from "../../context/ExecutionContextFactory";

const mockCIRun = vi.fn();
const mockSCFWInstall = vi.fn();
const mockNpmInstall = vi.fn();

// Mock the child services
vi.mock("../ci/CIInstallService", () => ({
  CIInstallService: class {
    run = mockCIRun;
  },
}));

vi.mock("../scfw/SCFWService", () => ({
  SCFWService: class {
    install = mockSCFWInstall;
  },
}));

vi.mock("../npm/NpmInstallService", () => ({
  NpmInstallService: class {
    install = mockNpmInstall;
  },
}));

describe("InstallRunner", () => {
  const mockContext = ExecutionContextFactory.createMock();
  let runner: InstallRunner;

  beforeEach(() => {
    vi.clearAllMocks();
    runner = new InstallRunner(mockContext);
  });

  describe("run()", () => {
    it("runs CI install when no packages provided", async () => {
      mockCIRun.mockResolvedValue(true);

      const result = await runner.run();

      expect(mockSCFWInstall).not.toHaveBeenCalled();
      expect(mockCIRun).toHaveBeenCalled();
      expect(result.scfwSuccess).toBeFalsy();
      expect(result.ciSuccess).toBeTruthy();
    });

    it("runs SCFW and CI install when packages provided", async () => {
      mockSCFWInstall.mockResolvedValue(true);
      mockCIRun.mockResolvedValue(true);

      const packages = [{ name: "chalk", version: "5.0.0" }];
      const result = await runner.run(packages);

      expect(mockSCFWInstall).toHaveBeenCalledWith(packages);
      expect(mockCIRun).toHaveBeenCalled();
      expect(result.scfwSuccess).toBeTruthy();
      expect(result.ciSuccess).toBeTruthy();
    });

    it("skips SCFW when packages array is empty", async () => {
      mockCIRun.mockResolvedValue(true);

      const result = await runner.run([]);

      expect(mockSCFWInstall).not.toHaveBeenCalled();
      expect(result.scfwSuccess).toBeFalsy();
    });

    it("returns CI null when CI is skipped", async () => {
      mockCIRun.mockResolvedValue(null);

      const result = await runner.run();

      expect(result.ciSuccess).toBeNull();
    });
  });

  describe("runSCFW()", () => {
    it("runs only SCFW install", async () => {
      mockSCFWInstall.mockResolvedValue(true);

      const packages = [{ name: "chalk", version: "5.0.0" }];
      const result = await runner.runSCFW(packages);

      expect(mockSCFWInstall).toHaveBeenCalledWith(packages);
      expect(mockCIRun).not.toHaveBeenCalled();
      expect(result).toBeTruthy();
    });

    it("returns false when SCFW fails", async () => {
      mockSCFWInstall.mockResolvedValue(false);

      const packages = [{ name: "chalk", version: "5.0.0" }];
      const result = await runner.runSCFW(packages);

      expect(result).toBeFalsy();
    });
  });

  describe("runCI()", () => {
    it("runs only CI install", async () => {
      mockCIRun.mockResolvedValue(true);

      const result = await runner.runCI();

      expect(mockCIRun).toHaveBeenCalled();
      expect(mockSCFWInstall).not.toHaveBeenCalled();
      expect(result).toBeTruthy();
    });

    it("returns null when CI is skipped", async () => {
      mockCIRun.mockResolvedValue(null);

      const result = await runner.runCI();

      expect(result).toBeNull();
    });

    it("returns false when CI fails", async () => {
      mockCIRun.mockResolvedValue(false);

      const result = await runner.runCI();

      expect(result).toBeFalsy();
    });
  });

  describe("with useNpmFallback=true", () => {
    let npmRunner: InstallRunner;

    beforeEach(() => {
      vi.clearAllMocks();
      npmRunner = new InstallRunner(mockContext, true);
    });

    describe("run()", () => {
      it("uses npm install instead of scfw when packages provided", async () => {
        mockNpmInstall.mockResolvedValue(true);
        mockCIRun.mockResolvedValue(true);

        const packages = [{ name: "chalk", version: "5.0.0" }];
        const result = await npmRunner.run(packages);

        expect(mockNpmInstall).toHaveBeenCalledWith(packages);
        expect(mockSCFWInstall).not.toHaveBeenCalled();
        expect(mockCIRun).toHaveBeenCalled();
        expect(result.scfwSuccess).toBeTruthy();
        expect(result.ciSuccess).toBeTruthy();
      });

      it("still runs CI install with npm fallback", async () => {
        mockCIRun.mockResolvedValue(true);

        const result = await npmRunner.run();

        expect(mockCIRun).toHaveBeenCalled();
        expect(result.ciSuccess).toBeTruthy();
      });
    });

    describe("runSCFW()", () => {
      it("uses npm install instead of scfw", async () => {
        mockNpmInstall.mockResolvedValue(true);

        const packages = [{ name: "chalk", version: "5.0.0" }];
        const result = await npmRunner.runSCFW(packages);

        expect(mockNpmInstall).toHaveBeenCalledWith(packages);
        expect(mockSCFWInstall).not.toHaveBeenCalled();
        expect(result).toBeTruthy();
      });

      it("returns false when npm install fails", async () => {
        mockNpmInstall.mockResolvedValue(false);

        const packages = [{ name: "chalk", version: "5.0.0" }];
        const result = await npmRunner.runSCFW(packages);

        expect(result).toBeFalsy();
      });
    });
  });
});
