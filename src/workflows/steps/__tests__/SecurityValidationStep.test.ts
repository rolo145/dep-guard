import { describe, it, expect, vi, beforeEach } from "vitest";
import { SecurityValidationStep } from "../SecurityValidationStep";
import type { StepContext } from "../IWorkflowStep";
import { WORKFLOW_STEPS } from "../../types";

vi.mock("../../../logger", () => ({
  logger: {
    warning: vi.fn(),
  },
}));

import { logger } from "../../../logger";

describe("SecurityValidationStep", () => {
  let step: SecurityValidationStep;
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
        npq: {
          processSelection: vi.fn(),
        } as unknown as StepContext["services"]["npq"],
        install: {} as StepContext["services"]["install"],
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

    step = new SecurityValidationStep();
  });

  it("has correct name", () => {
    expect(step.name).toBe("SecurityValidation");
  });

  it("has correct step definition", () => {
    expect(step.stepDef).toEqual(WORKFLOW_STEPS.SECURITY);
  });

  describe("execute()", () => {
    it("processes selection through NPQ", async () => {
      const selected = [{ name: "lodash", version: "5.0.0" }];
      (mockContext.services.npq.processSelection as ReturnType<typeof vi.fn>).mockResolvedValue(selected);

      await step.execute(selected, mockContext);

      expect(mockContext.services.npq.processSelection).toHaveBeenCalledWith(selected);
    });

    it("exits early when no packages confirmed", async () => {
      const selected = [{ name: "lodash", version: "5.0.0" }];
      (mockContext.services.npq.processSelection as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await step.execute(selected, mockContext);

      expect(result.continue).toBe(false);
      expect(result.exitReason).toBe("no_packages_confirmed");
    });

    it("shows warning when no packages confirmed", async () => {
      const selected = [{ name: "lodash", version: "5.0.0" }];
      (mockContext.services.npq.processSelection as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await step.execute(selected, mockContext);

      expect(logger.warning).toHaveBeenCalledWith("No packages confirmed for installation");
    });

    it("continues when packages confirmed", async () => {
      const selected = [{ name: "lodash", version: "5.0.0" }];
      (mockContext.services.npq.processSelection as ReturnType<typeof vi.fn>).mockResolvedValue(selected);

      const result = await step.execute(selected, mockContext);

      expect(result.continue).toBe(true);
    });

    it("returns confirmed packages as data", async () => {
      const selected = [{ name: "lodash", version: "5.0.0" }, { name: "express", version: "4.19.0" }];
      const confirmed = [{ name: "lodash", version: "5.0.0" }];
      (mockContext.services.npq.processSelection as ReturnType<typeof vi.fn>).mockResolvedValue(confirmed);

      const result = await step.execute(selected, mockContext);

      expect(result.data).toEqual(confirmed);
    });

    it("passes all selected packages to NPQ", async () => {
      const selected = [
        { name: "lodash", version: "5.0.0" },
        { name: "express", version: "4.19.0" },
        { name: "axios", version: "1.6.0" },
      ];
      (mockContext.services.npq.processSelection as ReturnType<typeof vi.fn>).mockResolvedValue(selected);

      await step.execute(selected, mockContext);

      expect(mockContext.services.npq.processSelection).toHaveBeenCalledWith(selected);
    });
  });
});
