import { describe, it, expect, vi, beforeEach } from "vitest";
import { SelectPackagesStep } from "../SelectPackagesStep";
import type { StepContext } from "../IWorkflowStep";
import { WORKFLOW_STEPS } from "../../types";

vi.mock("../../../logger", () => ({
  logger: {
    warning: vi.fn(),
    success: vi.fn(),
  },
}));

import { logger } from "../../../logger";

describe("SelectPackagesStep", () => {
  let step: SelectPackagesStep;
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
        ncu: {
          promptSelection: vi.fn(),
        } as unknown as StepContext["services"]["ncu"],
        npq: {} as StepContext["services"]["npq"],
        install: {} as StepContext["services"]["install"],
        quality: {} as StepContext["services"]["quality"],
      },
      stats: {
        packagesFound: 2,
        packagesAfterFilter: 2,
        packagesSelected: 0,
        packagesInstalled: 0,
        packagesSkipped: 0,
        durationMs: 0,
      },
      days: 7,
    };

    step = new SelectPackagesStep();
  });

  it("has correct name", () => {
    expect(step.name).toBe("SelectPackages");
  });

  it("has correct step definition", () => {
    expect(step.stepDef).toEqual(WORKFLOW_STEPS.SELECT);
  });

  describe("execute()", () => {
    it("prompts for selection with choices", async () => {
      const input = {
        grouped: {},
        choices: [{ name: "lodash", value: { name: "lodash", version: "5.0.0" } }],
      };
      (mockContext.services.ncu.promptSelection as ReturnType<typeof vi.fn>).mockResolvedValue([
        { name: "lodash", version: "5.0.0" },
      ]);

      await step.execute(input, mockContext);

      expect(mockContext.services.ncu.promptSelection).toHaveBeenCalledWith(input.choices);
    });

    it("exits early when no packages selected", async () => {
      const input = { grouped: {}, choices: [] };
      (mockContext.services.ncu.promptSelection as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await step.execute(input, mockContext);

      expect(result.continue).toBeFalsy();
      expect(result.exitReason).toBe("no_packages_selected");
    });

    it("shows warning when no packages selected", async () => {
      const input = { grouped: {}, choices: [] };
      (mockContext.services.ncu.promptSelection as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await step.execute(input, mockContext);

      expect(logger.warning).toHaveBeenCalledWith("No packages selected");
    });

    it("continues when packages selected", async () => {
      const input = { grouped: {}, choices: [] };
      const selected = [{ name: "lodash", version: "5.0.0" }];
      (mockContext.services.ncu.promptSelection as ReturnType<typeof vi.fn>).mockResolvedValue(selected);

      const result = await step.execute(input, mockContext);

      expect(result.continue).toBeTruthy();
    });

    it("returns selected packages as data", async () => {
      const input = { grouped: {}, choices: [] };
      const selected = [{ name: "lodash", version: "5.0.0" }, { name: "express", version: "4.19.0" }];
      (mockContext.services.ncu.promptSelection as ReturnType<typeof vi.fn>).mockResolvedValue(selected);

      const result = await step.execute(input, mockContext);

      expect(result.data).toEqual(selected);
    });

    it("updates stats with packages selected", async () => {
      const input = { grouped: {}, choices: [] };
      const selected = [{ name: "lodash", version: "5.0.0" }, { name: "express", version: "4.19.0" }];
      (mockContext.services.ncu.promptSelection as ReturnType<typeof vi.fn>).mockResolvedValue(selected);

      await step.execute(input, mockContext);

      expect(mockContext.stats.packagesSelected).toBe(2);
    });

    it("shows success message with count", async () => {
      const input = { grouped: {}, choices: [] };
      const selected = [{ name: "lodash", version: "5.0.0" }];
      (mockContext.services.ncu.promptSelection as ReturnType<typeof vi.fn>).mockResolvedValue(selected);

      await step.execute(input, mockContext);

      expect(logger.success).toHaveBeenCalledWith("Selected 1 package(s) for update");
    });
  });
});
