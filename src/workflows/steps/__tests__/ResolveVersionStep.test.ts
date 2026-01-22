import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResolveVersionStep } from "../ResolveVersionStep";
import type { IExecutionContext } from "../../../context/IExecutionContext";
import type { PackageSpec } from "../../add/types";
import { PackageResolverService } from "../../../ncu/PackageResolverService";

// Mock dependencies
vi.mock("../../../logger", () => ({
  logger: {
    spinner: vi.fn(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      succeed: vi.fn(),
      fail: vi.fn(),
      text: "",
    })),
    newLine: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@inquirer/prompts", () => ({
  select: vi.fn(),
}));

vi.mock("../../../ncu/PackageResolverService");

import { select } from "@inquirer/prompts";

describe("ResolveVersionStep", () => {
  let step: ResolveVersionStep;
  let mockContext: IExecutionContext;
  let mockResolverService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
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
    };

    mockResolverService = {
      resolveLatestSafeVersion: vi.fn(),
      validateVersion: vi.fn(),
    };

    vi.mocked(PackageResolverService).mockImplementation(function (this: any) {
      return mockResolverService;
    } as any);

    step = new ResolveVersionStep(mockContext);
  });

  describe("execute() - without user-specified version", () => {
    it("resolves latest safe version when no version specified", async () => {
      const packageSpec: PackageSpec = { name: "vue" };

      mockResolverService.resolveLatestSafeVersion.mockResolvedValue({
        version: "3.2.0",
        tooNew: false,
        ageInDays: 14,
      });

      const result = await step.execute(packageSpec);

      expect(result.success).toBeTruthy();
      expect(result.package).toStrictEqual({
        name: "vue",
        version: "3.2.0",
        wasSpecified: false,
        ageInDays: 14,
      });
      expect(mockResolverService.resolveLatestSafeVersion).toHaveBeenCalledWith("vue");
    });

    it("returns error when no safe version found", async () => {
      const packageSpec: PackageSpec = { name: "vue" };

      mockResolverService.resolveLatestSafeVersion.mockResolvedValue({
        version: null,
        tooNew: true,
      });

      const result = await step.execute(packageSpec);

      expect(result.success).toBeFalsy();
      expect(result.errorMessage).toContain("No version of vue is at least");
    });
  });

  describe("execute() - with user-specified version", () => {
    it("validates user-specified version that meets safety buffer", async () => {
      const packageSpec: PackageSpec = { name: "vue", version: "3.2.0" };

      mockResolverService.validateVersion.mockResolvedValue({
        version: "3.2.0",
        tooNew: false,
        ageInDays: 14,
      });

      const result = await step.execute(packageSpec);

      expect(result.success).toBeTruthy();
      expect(result.package).toStrictEqual({
        name: "vue",
        version: "3.2.0",
        wasSpecified: true,
        ageInDays: 14,
      });
      expect(mockResolverService.validateVersion).toHaveBeenCalledWith("vue", "3.2.0");
    });

    it("prompts user when version is too new and user cancels", async () => {
      const packageSpec: PackageSpec = { name: "vue", version: "3.3.0" };

      mockResolverService.validateVersion.mockResolvedValue({
        version: "3.3.0",
        tooNew: true,
        ageInDays: 3,
      });

      vi.mocked(select).mockResolvedValue("cancel");

      const result = await step.execute(packageSpec);

      expect(result.success).toBeFalsy();
      expect(result.errorMessage).toContain("cancelled");
    });

    it("prompts user when version is too new and user continues anyway", async () => {
      const packageSpec: PackageSpec = { name: "vue", version: "3.3.0" };

      mockResolverService.validateVersion.mockResolvedValue({
        version: "3.3.0",
        tooNew: true,
        ageInDays: 3,
      });

      vi.mocked(select).mockResolvedValue("continue");

      const result = await step.execute(packageSpec);

      expect(result.success).toBeTruthy();
      expect(result.package?.version).toBe("3.3.0");
      expect(result.package?.wasSpecified).toBeTruthy();
    });

    it("prompts user when version is too new and user chooses latest safe", async () => {
      const packageSpec: PackageSpec = { name: "vue", version: "3.3.0" };

      mockResolverService.validateVersion.mockResolvedValue({
        version: "3.3.0",
        tooNew: true,
        ageInDays: 3,
      });

      mockResolverService.resolveLatestSafeVersion.mockResolvedValue({
        version: "3.2.0",
        tooNew: false,
        ageInDays: 14,
      });

      vi.mocked(select).mockResolvedValue("latest_safe");

      const result = await step.execute(packageSpec);

      expect(result.success).toBeTruthy();
      expect(result.package?.version).toBe("3.2.0");
      expect(result.package?.wasSpecified).toBeFalsy();
      expect(mockResolverService.resolveLatestSafeVersion).toHaveBeenCalledWith("vue");
    });

    it("returns error when version not found", async () => {
      const packageSpec: PackageSpec = { name: "vue", version: "99.0.0" };

      mockResolverService.validateVersion.mockResolvedValue({
        version: null,
        tooNew: false,
      });

      const result = await step.execute(packageSpec);

      expect(result.success).toBeFalsy();
      expect(result.errorMessage).toContain("Version 99.0.0 not found");
    });
  });

  describe("error handling", () => {
    it("handles registry errors gracefully", async () => {
      const packageSpec: PackageSpec = { name: "vue" };

      mockResolverService.resolveLatestSafeVersion.mockRejectedValue(
        new Error("Registry unavailable"),
      );

      const result = await step.execute(packageSpec);

      expect(result.success).toBeFalsy();
      expect(result.errorMessage).toContain("Registry unavailable");
    });
  });
});
