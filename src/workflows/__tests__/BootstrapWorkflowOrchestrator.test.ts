import { describe, it, expect, vi, beforeEach } from "vitest";

const mockServiceInstance = {
  run: vi.fn(),
};

vi.mock("../../install/bootstrap/BootstrapInstallService", () => ({
  BootstrapInstallService: class {
    run = mockServiceInstance.run;
  },
}));

vi.mock("../../errors", () => ({
  isUserCancellation: vi.fn(),
  logCancellation: vi.fn(),
  EXIT_CODE_CANCELLED: 130,
}));

import { BootstrapWorkflowOrchestrator } from "../BootstrapWorkflowOrchestrator";
import * as errors from "../../errors";

describe("BootstrapWorkflowOrchestrator", () => {
  const defaultOptions = {
    days: 7,
    scripts: {
      lint: "lint",
      typecheck: "typecheck",
      test: "test",
      build: "build",
    },
    useNpmFallback: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("execute()", () => {
    it("creates and runs BootstrapInstallService", async () => {
      mockServiceInstance.run.mockResolvedValue(true);

      const orchestrator = new BootstrapWorkflowOrchestrator(defaultOptions);
      await orchestrator.execute();

      expect(mockServiceInstance.run).toHaveBeenCalled();
    });

    it("returns success result when install succeeds", async () => {
      mockServiceInstance.run.mockResolvedValue(true);

      const orchestrator = new BootstrapWorkflowOrchestrator(defaultOptions);
      const result = await orchestrator.execute();

      expect(result.success).toBeTruthy();
      expect(result.exitCode).toBe(0);
      expect(result.reason).toBe("completed");
    });

    it("returns success result with stats when install succeeds", async () => {
      mockServiceInstance.run.mockResolvedValue(true);

      const orchestrator = new BootstrapWorkflowOrchestrator(defaultOptions);
      const result = await orchestrator.execute();

      expect(result.stats).toBeDefined();
      expect(result.stats?.packagesFound).toBe(0);
      expect(result.stats?.durationMs).toBeGreaterThanOrEqual(0);
    });

    it("returns skipped result when user declines install", async () => {
      mockServiceInstance.run.mockResolvedValue(null);

      const orchestrator = new BootstrapWorkflowOrchestrator(defaultOptions);
      const result = await orchestrator.execute();

      expect(result.success).toBeTruthy();
      expect(result.exitCode).toBe(0);
      expect(result.reason).toBe("no_packages_selected");
    });

    it("handles user cancellation during prompts", async () => {
      const cancellationError = new Error("User cancelled");
      mockServiceInstance.run.mockRejectedValue(cancellationError);
      vi.mocked(errors.isUserCancellation).mockReturnValue(true);

      const orchestrator = new BootstrapWorkflowOrchestrator(defaultOptions);
      const result = await orchestrator.execute();

      expect(result.success).toBeFalsy();
      expect(result.exitCode).toBe(130);
      expect(result.reason).toBe("user_cancelled");
      expect(errors.logCancellation).toHaveBeenCalled();
    });

    it("re-throws unexpected errors", async () => {
      const unexpectedError = new Error("Unexpected error");
      mockServiceInstance.run.mockRejectedValue(unexpectedError);
      vi.mocked(errors.isUserCancellation).mockReturnValue(false);

      const orchestrator = new BootstrapWorkflowOrchestrator(defaultOptions);

      await expect(orchestrator.execute()).rejects.toThrow("Unexpected error");
    });

    it("works with npm fallback enabled", async () => {
      mockServiceInstance.run.mockResolvedValue(true);

      const orchestrator = new BootstrapWorkflowOrchestrator({ ...defaultOptions, useNpmFallback: true });
      const result = await orchestrator.execute();

      expect(result.success).toBeTruthy();
      expect(mockServiceInstance.run).toHaveBeenCalled();
    });

    it("includes duration in stats", async () => {
      mockServiceInstance.run.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(true), 10);
        });
      });

      const orchestrator = new BootstrapWorkflowOrchestrator(defaultOptions);
      const result = await orchestrator.execute();

      expect(result.stats?.durationMs).toBeGreaterThanOrEqual(10);
    });

    it("supports custom days value", async () => {
      mockServiceInstance.run.mockResolvedValue(true);

      const customOptions = { ...defaultOptions, days: 14 };
      const orchestrator = new BootstrapWorkflowOrchestrator(customOptions);
      const result = await orchestrator.execute();

      expect(result.success).toBeTruthy();
      expect(mockServiceInstance.run).toHaveBeenCalled();
    });
  });
});
