import { describe, it, expect, vi, beforeEach } from "vitest";
import { SafetyBufferStep } from "../SafetyBufferStep";
import type { StepContext } from "../IWorkflowStep";
import { WORKFLOW_STEPS } from "../../types";

describe("SafetyBufferStep", () => {
  let step: SafetyBufferStep;
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
          filterByAge: vi.fn(),
          showNoSafeUpdates: vi.fn(),
          showSafeUpdates: vi.fn(),
        } as unknown as StepContext["services"]["ncu"],
        npq: {} as StepContext["services"]["npq"],
        install: {} as StepContext["services"]["install"],
        quality: {} as StepContext["services"]["quality"],
      },
      stats: {
        packagesFound: 3,
        packagesAfterFilter: 0,
        packagesSelected: 0,
        packagesInstalled: 0,
        packagesSkipped: 0,
        durationMs: 0,
      },
      days: 7,
    };

    step = new SafetyBufferStep();
  });

  it("has correct name", () => {
    expect(step.name).toBe("SafetyBuffer");
  });

  it("has correct step definition", () => {
    expect(step.stepDef).toStrictEqual(WORKFLOW_STEPS.SAFETY_BUFFER);
  });

  describe("execute()", () => {
    it("filters updates by age", async () => {
      const rawUpdates = { lodash: "5.0.0", express: "4.19.0" };
      (mockContext.services.ncu.filterByAge as ReturnType<typeof vi.fn>).mockResolvedValue(rawUpdates);

      await step.execute(rawUpdates, mockContext);

      expect(mockContext.services.ncu.filterByAge).toHaveBeenCalledWith(rawUpdates);
    });

    it("exits early when all updates filtered", async () => {
      const rawUpdates = { lodash: "5.0.0" };
      (mockContext.services.ncu.filterByAge as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const result = await step.execute(rawUpdates, mockContext);

      expect(result.continue).toBeFalsy();
      expect(result.exitReason).toBe("all_updates_filtered");
    });

    it("shows no safe updates message when all filtered", async () => {
      const rawUpdates = { lodash: "5.0.0" };
      (mockContext.services.ncu.filterByAge as ReturnType<typeof vi.fn>).mockResolvedValue({});

      await step.execute(rawUpdates, mockContext);

      expect(mockContext.services.ncu.showNoSafeUpdates).toHaveBeenCalledWith(7);
    });

    it("continues when updates remain after filter", async () => {
      const rawUpdates = { lodash: "5.0.0", express: "4.19.0" };
      const filtered = { lodash: "5.0.0" };
      (mockContext.services.ncu.filterByAge as ReturnType<typeof vi.fn>).mockResolvedValue(filtered);

      const result = await step.execute(rawUpdates, mockContext);

      expect(result.continue).toBeTruthy();
    });

    it("returns filtered updates as data", async () => {
      const rawUpdates = { lodash: "5.0.0", express: "4.19.0" };
      const filtered = { lodash: "5.0.0" };
      (mockContext.services.ncu.filterByAge as ReturnType<typeof vi.fn>).mockResolvedValue(filtered);

      const result = await step.execute(rawUpdates, mockContext);

      expect(result.data).toStrictEqual(filtered);
    });

    it("updates stats with packages after filter", async () => {
      const rawUpdates = { lodash: "5.0.0", express: "4.19.0", axios: "1.6.0" };
      const filtered = { lodash: "5.0.0", express: "4.19.0" };
      (mockContext.services.ncu.filterByAge as ReturnType<typeof vi.fn>).mockResolvedValue(filtered);

      await step.execute(rawUpdates, mockContext);

      expect(mockContext.stats.packagesAfterFilter).toBe(2);
    });

    it("shows safe updates count", async () => {
      const rawUpdates = { lodash: "5.0.0", express: "4.19.0" };
      const filtered = { lodash: "5.0.0" };
      (mockContext.services.ncu.filterByAge as ReturnType<typeof vi.fn>).mockResolvedValue(filtered);

      await step.execute(rawUpdates, mockContext);

      expect(mockContext.services.ncu.showSafeUpdates).toHaveBeenCalledWith(1);
    });
  });
});
