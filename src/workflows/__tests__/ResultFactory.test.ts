import { describe, it, expect } from "vitest";
import { ResultFactory } from "../ResultFactory";
import { EXIT_CODE_CANCELLED } from "../../errors";
import type { WorkflowStats } from "../types";

describe("ResultFactory", () => {
  const mockStats: WorkflowStats = {
    packagesFound: 10,
    packagesAfterFilter: 8,
    packagesSelected: 5,
    packagesInstalled: 5,
    packagesSkipped: 0,
    durationMs: 5000,
  };

  describe("success()", () => {
    it("creates success result with correct properties", () => {
      const result = ResultFactory.success("completed", mockStats);

      expect(result).toEqual({
        success: true,
        exitCode: 0,
        reason: "completed",
        stats: mockStats,
      });
    });

    it("creates success result without stats", () => {
      const result = ResultFactory.success("completed");

      expect(result).toEqual({
        success: true,
        exitCode: 0,
        reason: "completed",
        stats: undefined,
      });
    });

    it("accepts all valid workflow exit reasons", () => {
      const reasons = [
        "completed",
        "no_updates_available",
        "all_updates_filtered",
        "no_packages_selected",
        "no_packages_confirmed",
      ] as const;

      reasons.forEach((reason) => {
        const result = ResultFactory.success(reason);
        expect(result.reason).toBe(reason);
        expect(result.success).toBe(true);
        expect(result.exitCode).toBe(0);
      });
    });
  });

  describe("failure()", () => {
    it("creates failure result with correct properties", () => {
      const result = ResultFactory.failure("completed", mockStats);

      expect(result).toEqual({
        success: false,
        exitCode: 1,
        reason: "completed",
        stats: mockStats,
      });
    });

    it("creates failure result without stats", () => {
      const result = ResultFactory.failure("completed");

      expect(result).toEqual({
        success: false,
        exitCode: 1,
        reason: "completed",
        stats: undefined,
      });
    });

    it("uses exit code 1 for failures", () => {
      const result = ResultFactory.failure("completed");

      expect(result.exitCode).toBe(1);
      expect(result.success).toBe(false);
    });
  });

  describe("cancelled()", () => {
    it("creates cancelled result with correct properties", () => {
      const result = ResultFactory.cancelled(mockStats);

      expect(result).toEqual({
        success: false,
        exitCode: EXIT_CODE_CANCELLED,
        reason: "user_cancelled",
        stats: mockStats,
      });
    });

    it("creates cancelled result without stats", () => {
      const result = ResultFactory.cancelled();

      expect(result).toEqual({
        success: false,
        exitCode: EXIT_CODE_CANCELLED,
        reason: "user_cancelled",
        stats: undefined,
      });
    });

    it("uses EXIT_CODE_CANCELLED (130) for SIGINT", () => {
      const result = ResultFactory.cancelled();

      expect(result.exitCode).toBe(EXIT_CODE_CANCELLED);
      expect(result.exitCode).toBe(130);
      expect(result.reason).toBe("user_cancelled");
      expect(result.success).toBe(false);
    });

    it("always sets reason to user_cancelled", () => {
      const result = ResultFactory.cancelled(mockStats);

      expect(result.reason).toBe("user_cancelled");
    });
  });

  describe("earlyExit()", () => {
    it("creates early exit result with correct properties", () => {
      const result = ResultFactory.earlyExit("no_updates_available", mockStats);

      expect(result).toEqual({
        success: true,
        exitCode: 0,
        reason: "no_updates_available",
        stats: mockStats,
      });
    });

    it("creates early exit result without stats", () => {
      const result = ResultFactory.earlyExit("no_packages_selected");

      expect(result).toEqual({
        success: true,
        exitCode: 0,
        reason: "no_packages_selected",
        stats: undefined,
      });
    });

    it("accepts early exit reasons", () => {
      const earlyExitReasons = [
        "no_updates_available",
        "all_updates_filtered",
        "no_packages_selected",
        "no_packages_confirmed",
      ] as const;

      earlyExitReasons.forEach((reason) => {
        const result = ResultFactory.earlyExit(reason);
        expect(result.reason).toBe(reason);
        expect(result.success).toBe(true);
        expect(result.exitCode).toBe(0);
      });
    });

    it("marks early exits as successful (not errors)", () => {
      const result = ResultFactory.earlyExit("no_updates_available");

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
    });
  });

  describe("consistency", () => {
    it("success and earlyExit both use exitCode 0", () => {
      const success = ResultFactory.success("completed");
      const earlyExit = ResultFactory.earlyExit("no_updates_available");

      expect(success.exitCode).toBe(earlyExit.exitCode);
      expect(success.exitCode).toBe(0);
    });

    it("failure and cancelled both have success: false", () => {
      const failure = ResultFactory.failure("completed");
      const cancelled = ResultFactory.cancelled();

      expect(failure.success).toBe(false);
      expect(cancelled.success).toBe(false);
    });

    it("only cancelled uses EXIT_CODE_CANCELLED", () => {
      const success = ResultFactory.success("completed");
      const failure = ResultFactory.failure("completed");
      const cancelled = ResultFactory.cancelled();
      const earlyExit = ResultFactory.earlyExit("no_updates_available");

      expect(success.exitCode).not.toBe(EXIT_CODE_CANCELLED);
      expect(failure.exitCode).not.toBe(EXIT_CODE_CANCELLED);
      expect(cancelled.exitCode).toBe(EXIT_CODE_CANCELLED);
      expect(earlyExit.exitCode).not.toBe(EXIT_CODE_CANCELLED);
    });
  });
});
