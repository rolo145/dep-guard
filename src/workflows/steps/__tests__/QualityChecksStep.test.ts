import { describe, it, expect, vi, beforeEach } from "vitest";
import { QualityChecksStep } from "../QualityChecksStep";
import type { StepContext } from "../IWorkflowStep";
import { WORKFLOW_STEPS } from "../../types";

describe("QualityChecksStep", () => {
  let step: QualityChecksStep;
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
          runAll: vi.fn(),
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

    step = new QualityChecksStep();
  });

  it("has correct name", () => {
    expect(step.name).toBe("QualityChecks");
  });

  it("has correct step definition", () => {
    expect(step.stepDef).toEqual(WORKFLOW_STEPS.QUALITY);
  });

  describe("execute()", () => {
    it("runs all quality checks via quality service", async () => {
      const packages = [{ name: "lodash", version: "5.0.0" }];
      (mockContext.services.quality.runAll as ReturnType<typeof vi.fn>).mockResolvedValue({
        lint: true,
        typeCheck: true,
        tests: true,
      });

      await step.execute(packages, mockContext);

      expect(mockContext.services.quality.runAll).toHaveBeenCalled();
    });

    it("always continues", async () => {
      const packages = [{ name: "lodash", version: "5.0.0" }];
      (mockContext.services.quality.runAll as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const result = await step.execute(packages, mockContext);

      expect(result.continue).toBe(true);
    });

    it("returns packages as data for next step", async () => {
      const packages = [{ name: "lodash", version: "5.0.0" }, { name: "express", version: "4.19.0" }];
      (mockContext.services.quality.runAll as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const result = await step.execute(packages, mockContext);

      expect(result.data).toEqual(packages);
    });

    it("continues even when quality checks fail", async () => {
      const packages = [{ name: "lodash", version: "5.0.0" }];
      (mockContext.services.quality.runAll as ReturnType<typeof vi.fn>).mockResolvedValue({
        lint: false,
        typeCheck: false,
        tests: false,
      });

      const result = await step.execute(packages, mockContext);

      expect(result.continue).toBe(true);
    });

    it("continues when quality checks are skipped", async () => {
      const packages = [{ name: "lodash", version: "5.0.0" }];
      (mockContext.services.quality.runAll as ReturnType<typeof vi.fn>).mockResolvedValue({
        lint: null,
        typeCheck: null,
        tests: null,
      });

      const result = await step.execute(packages, mockContext);

      expect(result.continue).toBe(true);
    });
  });
});
