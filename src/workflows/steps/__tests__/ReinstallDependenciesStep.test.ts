import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReinstallDependenciesStep } from "../ReinstallDependenciesStep";
import type { StepContext } from "../IWorkflowStep";
import { WORKFLOW_STEPS } from "../../types";

describe("ReinstallDependenciesStep", () => {
  let step: ReinstallDependenciesStep;
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
          reinstall: vi.fn(),
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

    step = new ReinstallDependenciesStep();
  });

  it("has correct name", () => {
    expect(step.name).toBe("ReinstallDependencies");
  });

  it("has correct step definition", () => {
    expect(step.stepDef).toStrictEqual(WORKFLOW_STEPS.REINSTALL);
  });

  describe("execute()", () => {
    it("reinstalls dependencies via install service", async () => {
      const packages = [{ name: "lodash", version: "5.0.0" }];
      (mockContext.services.install.reinstall as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await step.execute(packages, mockContext);

      expect(mockContext.services.install.reinstall).toHaveBeenCalled();
    });

    it("always continues", async () => {
      const packages = [{ name: "lodash", version: "5.0.0" }];
      (mockContext.services.install.reinstall as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const result = await step.execute(packages, mockContext);

      expect(result.continue).toBeTruthy();
    });

    it("returns packages as data for next step", async () => {
      const packages = [{ name: "lodash", version: "5.0.0" }, { name: "express", version: "4.19.0" }];
      (mockContext.services.install.reinstall as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const result = await step.execute(packages, mockContext);

      expect(result.data).toStrictEqual(packages);
    });

    it("calls reinstall without arguments", async () => {
      const packages = [{ name: "lodash", version: "5.0.0" }];
      (mockContext.services.install.reinstall as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await step.execute(packages, mockContext);

      expect(mockContext.services.install.reinstall).toHaveBeenCalledWith();
    });
  });
});
