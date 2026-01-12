import { describe, it, expect, vi, beforeEach } from "vitest";
import { CheckUpdatesStep } from "../CheckUpdatesStep";
import type { StepContext } from "../IWorkflowStep";
import { WORKFLOW_STEPS } from "../../types";

describe("CheckUpdatesStep", () => {
  let step: CheckUpdatesStep;
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
          loadUpdates: vi.fn(),
          showNoUpdates: vi.fn(),
          showPotentialUpdates: vi.fn(),
        } as unknown as StepContext["services"]["ncu"],
        npq: {} as StepContext["services"]["npq"],
        install: {} as StepContext["services"]["install"],
        quality: {} as StepContext["services"]["quality"],
      },
      stats: {
        packagesFound: 0,
        packagesAfterFilter: 0,
        packagesSelected: 0,
        packagesInstalled: 0,
        packagesSkipped: 0,
        durationMs: 0,
      },
      days: 7,
    };

    step = new CheckUpdatesStep();
  });

  it("has correct name", () => {
    expect(step.name).toBe("CheckUpdates");
  });

  it("has correct step definition", () => {
    expect(step.stepDef).toEqual(WORKFLOW_STEPS.CHECK_UPDATES);
  });

  describe("execute()", () => {
    it("exits early when loadUpdates returns null", async () => {
      (mockContext.services.ncu.loadUpdates as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await step.execute(undefined, mockContext);

      expect(result.continue).toBe(false);
      expect(result.exitReason).toBe("no_updates_available");
    });

    it("exits early when no updates available", async () => {
      (mockContext.services.ncu.loadUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const result = await step.execute(undefined, mockContext);

      expect(result.continue).toBe(false);
      expect(result.exitReason).toBe("no_updates_available");
    });

    it("shows no updates message when no updates", async () => {
      (mockContext.services.ncu.loadUpdates as ReturnType<typeof vi.fn>).mockResolvedValue({});

      await step.execute(undefined, mockContext);

      expect(mockContext.services.ncu.showNoUpdates).toHaveBeenCalled();
    });

    it("continues when updates available", async () => {
      const updates = { lodash: "5.0.0", express: "4.19.0" };
      (mockContext.services.ncu.loadUpdates as ReturnType<typeof vi.fn>).mockResolvedValue(updates);

      const result = await step.execute(undefined, mockContext);

      expect(result.continue).toBe(true);
    });

    it("returns updates as data", async () => {
      const updates = { lodash: "5.0.0" };
      (mockContext.services.ncu.loadUpdates as ReturnType<typeof vi.fn>).mockResolvedValue(updates);

      const result = await step.execute(undefined, mockContext);

      expect(result.data).toEqual(updates);
    });

    it("updates stats with packages found", async () => {
      const updates = { lodash: "5.0.0", express: "4.19.0", axios: "1.6.0" };
      (mockContext.services.ncu.loadUpdates as ReturnType<typeof vi.fn>).mockResolvedValue(updates);

      await step.execute(undefined, mockContext);

      expect(mockContext.stats.packagesFound).toBe(3);
    });

    it("shows potential updates count", async () => {
      const updates = { lodash: "5.0.0", express: "4.19.0" };
      (mockContext.services.ncu.loadUpdates as ReturnType<typeof vi.fn>).mockResolvedValue(updates);

      await step.execute(undefined, mockContext);

      expect(mockContext.services.ncu.showPotentialUpdates).toHaveBeenCalledWith(2);
    });
  });
});
