import { describe, it, expect, vi, beforeEach } from "vitest";
import { AddInstallPackageStep } from "../AddInstallPackageStep";
import type { IExecutionContext } from "../../../context/IExecutionContext";
import type { ConfirmedPackage } from "../../add/types";

// Mock dependencies
vi.mock("../../../logger", () => ({
  logger: {
    spinner: vi.fn(() => ({
      succeed: vi.fn(),
      fail: vi.fn(),
    })),
    newLine: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("chalk", () => ({
  default: {
    bold: vi.fn((text: string) => text),
    dim: vi.fn((text: string) => text),
    cyan: vi.fn((text: string) => text),
    green: vi.fn((text: string) => text),
    blue: vi.fn((text: string) => text),
  },
}));

vi.mock("../../../install/scfw/SCFWRunner");
vi.mock("../../../install/npm/NpmInstallRunner");
vi.mock("../../../install/ci/CIInstallService");

import { SCFWRunner } from "../../../install/scfw/SCFWRunner";
import { NpmInstallRunner } from "../../../install/npm/NpmInstallRunner";
import { CIInstallService } from "../../../install/ci/CIInstallService";

describe("AddInstallPackageStep", () => {
  let step: AddInstallPackageStep;
  let mockContext: IExecutionContext;
  let mockSCFWRunner: any;
  let mockNpmRunner: any;
  let mockCIInstall: any;

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

    mockSCFWRunner = {
      installSingle: vi.fn(),
    };

    mockNpmRunner = {
      installSingle: vi.fn(),
    };

    mockCIInstall = {
      run: vi.fn(),
    };

    vi.mocked(SCFWRunner).mockImplementation(function (this: any) {
      return mockSCFWRunner;
    } as any);
    vi.mocked(NpmInstallRunner).mockImplementation(function (this: any) {
      return mockNpmRunner;
    } as any);
    vi.mocked(CIInstallService).mockImplementation(function (this: any) {
      return mockCIInstall;
    } as any);
  });

  describe("execute() - using SCFW", () => {
    beforeEach(() => {
      step = new AddInstallPackageStep(mockContext, false);
    });

    it("installs package successfully without --save-dev", async () => {
      const confirmed: ConfirmedPackage = {
        name: "vue",
        version: "3.2.0",
        wasSpecified: false,
        ageInDays: 14,
        saveDev: false,
        existing: { exists: false },
        npqPassed: true,
        userConfirmed: true,
      };

      mockSCFWRunner.installSingle.mockReturnValue({ success: true });
      mockCIInstall.run.mockResolvedValue(true);

      const result = await step.execute(confirmed);

      expect(result.success).toBeTruthy();
      expect(result.package?.installSuccess).toBeTruthy();
      expect(mockSCFWRunner.installSingle).toHaveBeenCalledWith("vue@3.2.0", false);
      expect(mockCIInstall.run).toHaveBeenCalled();
    });

    it("installs package successfully with --save-dev", async () => {
      const confirmed: ConfirmedPackage = {
        name: "typescript",
        version: "5.0.0",
        wasSpecified: true,
        ageInDays: 30,
        saveDev: true,
        existing: { exists: false },
        npqPassed: true,
        userConfirmed: true,
      };

      mockSCFWRunner.installSingle.mockReturnValue({ success: true });
      mockCIInstall.run.mockResolvedValue(true);

      const result = await step.execute(confirmed);

      expect(result.success).toBeTruthy();
      expect(mockSCFWRunner.installSingle).toHaveBeenCalledWith("typescript@5.0.0", true);
    });

    it("returns error when package installation fails", async () => {
      const confirmed: ConfirmedPackage = {
        name: "vue",
        version: "3.2.0",
        wasSpecified: false,
        ageInDays: 14,
        saveDev: false,
        existing: { exists: false },
        npqPassed: true,
        userConfirmed: true,
      };

      mockSCFWRunner.installSingle.mockReturnValue({ success: false });

      const result = await step.execute(confirmed);

      expect(result.success).toBeFalsy();
      expect(result.errorMessage).toContain("Installation failed");
      expect(mockCIInstall.run).not.toHaveBeenCalled();
    });

    it("returns error when CI reinstall fails", async () => {
      const confirmed: ConfirmedPackage = {
        name: "vue",
        version: "3.2.0",
        wasSpecified: false,
        ageInDays: 14,
        saveDev: false,
        existing: { exists: false },
        npqPassed: true,
        userConfirmed: true,
      };

      mockSCFWRunner.installSingle.mockReturnValue({ success: true });
      mockCIInstall.run.mockResolvedValue(false);

      const result = await step.execute(confirmed);

      expect(result.success).toBeFalsy();
      expect(result.errorMessage).toContain("Failed to reinstall dependencies");
    });
  });

  describe("execute() - using npm fallback", () => {
    beforeEach(() => {
      step = new AddInstallPackageStep(mockContext, true);
    });

    it("uses npm runner when fallback enabled", async () => {
      const confirmed: ConfirmedPackage = {
        name: "vue",
        version: "3.2.0",
        wasSpecified: false,
        ageInDays: 14,
        saveDev: false,
        existing: { exists: false },
        npqPassed: true,
        userConfirmed: true,
      };

      mockNpmRunner.installSingle.mockReturnValue({ success: true });
      mockCIInstall.run.mockResolvedValue(true);

      const result = await step.execute(confirmed);

      expect(result.success).toBeTruthy();
      expect(mockNpmRunner.installSingle).toHaveBeenCalledWith("vue@3.2.0", false);
      expect(mockSCFWRunner.installSingle).not.toHaveBeenCalled();
    });

    it("passes saveDev flag to npm runner", async () => {
      const confirmed: ConfirmedPackage = {
        name: "typescript",
        version: "5.0.0",
        wasSpecified: true,
        ageInDays: 30,
        saveDev: true,
        existing: { exists: false },
        npqPassed: true,
        userConfirmed: true,
      };

      mockNpmRunner.installSingle.mockReturnValue({ success: true });
      mockCIInstall.run.mockResolvedValue(true);

      const result = await step.execute(confirmed);

      expect(result.success).toBeTruthy();
      expect(mockNpmRunner.installSingle).toHaveBeenCalledWith("typescript@5.0.0", true);
    });
  });

  describe("execute() - scoped packages", () => {
    beforeEach(() => {
      step = new AddInstallPackageStep(mockContext, false);
    });

    it("handles scoped packages correctly", async () => {
      const confirmed: ConfirmedPackage = {
        name: "@vue/cli",
        version: "5.0.0",
        wasSpecified: true,
        ageInDays: 30,
        saveDev: true,
        existing: { exists: false },
        npqPassed: true,
        userConfirmed: true,
      };

      mockSCFWRunner.installSingle.mockReturnValue({ success: true });
      mockCIInstall.run.mockResolvedValue(true);

      const result = await step.execute(confirmed);

      expect(result.success).toBeTruthy();
      expect(mockSCFWRunner.installSingle).toHaveBeenCalledWith("@vue/cli@5.0.0", true);
    });
  });

  describe("execute() - updating existing packages", () => {
    beforeEach(() => {
      step = new AddInstallPackageStep(mockContext, false);
    });

    it("handles updating existing package", async () => {
      const confirmed: ConfirmedPackage = {
        name: "lodash",
        version: "4.17.21",
        wasSpecified: false,
        ageInDays: 100,
        saveDev: false,
        existing: {
          exists: true,
          currentVersion: "4.17.20",
          location: "dependencies",
        },
        npqPassed: true,
        userConfirmed: true,
      };

      mockSCFWRunner.installSingle.mockReturnValue({ success: true });
      mockCIInstall.run.mockResolvedValue(true);

      const result = await step.execute(confirmed);

      expect(result.success).toBeTruthy();
      expect(mockSCFWRunner.installSingle).toHaveBeenCalledWith("lodash@4.17.21", false);
    });
  });
});
