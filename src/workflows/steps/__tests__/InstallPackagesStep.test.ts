import { describe, it, expect, vi, beforeEach } from "vitest";
import { InstallPackagesStep } from "../InstallPackagesStep";
import type { StepContext } from "../IWorkflowStep";
import { WORKFLOW_STEPS } from "../../types";

describe("InstallPackagesStep", () => {
  let step: InstallPackagesStep;
  let mockContext: StepContext;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
      workflow: {
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
      },
      services: {
        ncu: {} as StepContext["services"]["ncu"],
        npq: {} as StepContext["services"]["npq"],
        install: {
          installPackages: vi.fn(),
        } as unknown as StepContext["services"]["install"],
        quality: {} as StepContext["services"]["quality"],
      },
      stats: {
        packagesFound: 2,
        packagesAfterFilter: 2,
        packagesSelected: 2,
        packagesInstalled: 0,
        packagesSkipped: 0,
        durationMs: 0,
      },
      days: 7,
    };

    step = new InstallPackagesStep();
  });

  it("has correct name", () => {
    expect(step.name).toBe("InstallPackages");
  });

  it("has correct step definition", () => {
    expect(step.stepDef).toEqual(WORKFLOW_STEPS.INSTALL);
  });

  describe("execute()", () => {
    it("installs packages via install service", async () => {
      const packages = [{ name: "lodash", version: "5.0.0" }];
      (mockContext.services.install.installPackages as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await step.execute(packages, mockContext);

      expect(mockContext.services.install.installPackages).toHaveBeenCalledWith(packages);
    });

    it("always continues", async () => {
      const packages = [{ name: "lodash", version: "5.0.0" }];
      (mockContext.services.install.installPackages as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const result = await step.execute(packages, mockContext);

      expect(result.continue).toBeTruthy();
    });

    it("returns packages as data for next step", async () => {
      const packages = [{ name: "lodash", version: "5.0.0" }, { name: "express", version: "4.19.0" }];
      (mockContext.services.install.installPackages as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const result = await step.execute(packages, mockContext);

      expect(result.data).toEqual(packages);
    });

    it("passes multiple packages to install service", async () => {
      const packages = [
        { name: "lodash", version: "5.0.0" },
        { name: "express", version: "4.19.0" },
        { name: "axios", version: "1.6.0" },
      ];
      (mockContext.services.install.installPackages as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await step.execute(packages, mockContext);

      expect(mockContext.services.install.installPackages).toHaveBeenCalledWith(packages);
    });
  });
});
