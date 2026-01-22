import { describe, it, expect, vi, beforeEach } from "vitest";
import { OrganizeUpdatesStep } from "../OrganizeUpdatesStep";
import type { StepContext } from "../IWorkflowStep";
import { WORKFLOW_STEPS } from "../../types";

describe("OrganizeUpdatesStep", () => {
  let step: OrganizeUpdatesStep;
  let mockContext: StepContext;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
      workflow: {
        cutoff: new Date(),
        cutoffIso: new Date().toISOString(),
        days: 7,
        allDependencies: { lodash: "4.0.0", express: "4.18.0" },
        dependencies: { lodash: "4.0.0" },
        devDependencies: { express: "4.18.0" },
        scripts: {},
        scriptNames: { lint: "lint", typecheck: "typecheck", test: "test", build: "build" },
        raw: {},
        hasScript: vi.fn(),
        hasPackage: vi.fn(),
        getPackageVersion: vi.fn(),
      },
      services: {
        ncu: {
          buildChoices: vi.fn(),
          showGroupSummary: vi.fn(),
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

    step = new OrganizeUpdatesStep();
  });

  it("has correct name", () => {
    expect(step.name).toBe("OrganizeUpdates");
  });

  it("has correct step definition", () => {
    expect(step.stepDef).toStrictEqual(WORKFLOW_STEPS.ORGANIZE);
  });

  describe("execute()", () => {
    it("builds choices from updates", async () => {
      const updates = { lodash: "5.0.0", express: "4.19.0" };
      const grouped = { major: [], minor: [], patch: [] };
      const choices = [{ name: "lodash", value: { name: "lodash", version: "5.0.0" } }];

      (mockContext.services.ncu.buildChoices as ReturnType<typeof vi.fn>).mockReturnValue({
        grouped,
        choices,
      });

      await step.execute(updates, mockContext);

      expect(mockContext.services.ncu.buildChoices).toHaveBeenCalledWith(
        updates,
        mockContext.workflow.allDependencies
      );
    });

    it("always continues", async () => {
      const updates = { lodash: "5.0.0" };
      (mockContext.services.ncu.buildChoices as ReturnType<typeof vi.fn>).mockReturnValue({
        grouped: {},
        choices: [],
      });

      const result = await step.execute(updates, mockContext);

      expect(result.continue).toBeTruthy();
    });

    it("returns grouped and choices as data", async () => {
      const updates = { lodash: "5.0.0" };
      const grouped = { major: [{ name: "lodash" }], minor: [], patch: [] };
      const choices = [{ name: "lodash", value: { name: "lodash", version: "5.0.0" } }];

      (mockContext.services.ncu.buildChoices as ReturnType<typeof vi.fn>).mockReturnValue({
        grouped,
        choices,
      });

      const result = await step.execute(updates, mockContext);

      expect(result.data).toStrictEqual({ grouped, choices });
    });

    it("shows group summary", async () => {
      const updates = { lodash: "5.0.0" };
      const grouped = { major: [], minor: [], patch: [] };

      (mockContext.services.ncu.buildChoices as ReturnType<typeof vi.fn>).mockReturnValue({
        grouped,
        choices: [],
      });

      await step.execute(updates, mockContext);

      expect(mockContext.services.ncu.showGroupSummary).toHaveBeenCalledWith(grouped);
    });
  });
});
