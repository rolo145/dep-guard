import { describe, it, expect, vi, beforeEach } from "vitest";
import { BuildVerificationStep } from "../BuildVerificationStep";
import type { StepContext } from "../IWorkflowStep";
import { WORKFLOW_STEPS } from "../../types";

describe("BuildVerificationStep", () => {
  let step: BuildVerificationStep;
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
        install: {} as StepContext["services"]["install"],
        quality: {
          runBuild: vi.fn(),
        } as unknown as StepContext["services"]["quality"],
      },
      stats: {
        packagesFound: 2,
        packagesAfterFilter: 2,
        packagesSelected: 2,
        packagesInstalled: 2,
        packagesSkipped: 0,
        durationMs: 0,
      },
      days: 7,
    };

    step = new BuildVerificationStep();
  });

  it("has correct name", () => {
    expect(step.name).toBe("BuildVerification");
  });

  it("has correct step definition", () => {
    expect(step.stepDef).toStrictEqual(WORKFLOW_STEPS.BUILD);
  });

  describe("execute()", () => {
    it("runs build via quality service", async () => {
      const packages = [{ name: "lodash", version: "5.0.0" }];
      (mockContext.services.quality.runBuild as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      await step.execute(packages, mockContext);

      expect(mockContext.services.quality.runBuild).toHaveBeenCalled();
    });

    it("always continues", async () => {
      const packages = [{ name: "lodash", version: "5.0.0" }];
      (mockContext.services.quality.runBuild as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      const result = await step.execute(packages, mockContext);

      expect(result.continue).toBeTruthy();
    });

    it("returns packages as data", async () => {
      const packages = [{ name: "lodash", version: "5.0.0" }, { name: "express", version: "4.19.0" }];
      (mockContext.services.quality.runBuild as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      const result = await step.execute(packages, mockContext);

      expect(result.data).toStrictEqual(packages);
    });

    it("continues even when build fails", async () => {
      const packages = [{ name: "lodash", version: "5.0.0" }];
      (mockContext.services.quality.runBuild as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const result = await step.execute(packages, mockContext);

      expect(result.continue).toBeTruthy();
    });

    it("continues when build is skipped", async () => {
      const packages = [{ name: "lodash", version: "5.0.0" }];
      (mockContext.services.quality.runBuild as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await step.execute(packages, mockContext);

      expect(result.continue).toBeTruthy();
    });
  });
});
