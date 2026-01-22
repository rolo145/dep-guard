import { describe, it, expect, vi, beforeEach } from "vitest";
import { CheckExistingPackageStep } from "../CheckExistingPackageStep";
import type { IExecutionContext } from "../../../context/IExecutionContext";
import type { ResolvedPackage } from "../../add/types";

// Mock dependencies
vi.mock("../../../logger", () => ({
  logger: {
    info: vi.fn(),
    newLine: vi.fn(),
    success: vi.fn(),
    gray: vi.fn((text: string) => text),
  },
}));

vi.mock("chalk", () => ({
  default: {
    bold: vi.fn((text: string) => text),
    yellow: vi.fn((text: string) => text),
    green: vi.fn((text: string) => text),
    cyan: vi.fn((text: string) => text),
    gray: vi.fn((text: string) => text),
  },
}));

vi.mock("@inquirer/prompts", () => ({
  select: vi.fn(),
}));

import { select } from "@inquirer/prompts";

describe("CheckExistingPackageStep", () => {
  let step: CheckExistingPackageStep;
  let mockContext: IExecutionContext;

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

    step = new CheckExistingPackageStep(mockContext);
  });

  describe("execute() - package does not exist", () => {
    it("proceeds when package does not exist", async () => {
      const resolved: ResolvedPackage = {
        name: "vue",
        version: "3.2.0",
        wasSpecified: false,
        ageInDays: 14,
      };

      const result = await step.execute(resolved, false);

      expect(result.shouldProceed).toBeTruthy();
      expect(result.package).toStrictEqual({
        ...resolved,
        saveDev: false,
        existing: {
          exists: false,
        },
      });
    });

    it("sets saveDev flag correctly when adding as dev dependency", async () => {
      const resolved: ResolvedPackage = {
        name: "typescript",
        version: "5.0.0",
        wasSpecified: false,
        ageInDays: 14,
      };

      const result = await step.execute(resolved, true);

      expect(result.shouldProceed).toBeTruthy();
      expect(result.package?.saveDev).toBeTruthy();
    });
  });

  describe("execute() - package exists in dependencies", () => {
    beforeEach(() => {
      Object.assign(mockContext.dependencies, {
        vue: "3.0.0",
      });
    });

    it("does not proceed when same version in same location", async () => {
      const resolved: ResolvedPackage = {
        name: "vue",
        version: "3.0.0",
        wasSpecified: false,
        ageInDays: 14,
      };

      const result = await step.execute(resolved, false);

      expect(result.shouldProceed).toBeFalsy();
      expect(result.cancelReason).toContain("already installed");
    });

    it("prompts user when version is different and user chooses to update", async () => {
      const resolved: ResolvedPackage = {
        name: "vue",
        version: "3.2.0",
        wasSpecified: false,
        ageInDays: 14,
      };

      vi.mocked(select).mockResolvedValue("update");

      const result = await step.execute(resolved, false);

      expect(result.shouldProceed).toBeTruthy();
      expect(result.package?.existing).toStrictEqual({
        exists: true,
        currentVersion: "3.0.0",
        location: "dependencies",
      });
    });

    it("prompts user when version is different and user chooses to keep", async () => {
      const resolved: ResolvedPackage = {
        name: "vue",
        version: "3.2.0",
        wasSpecified: false,
        ageInDays: 14,
      };

      vi.mocked(select).mockResolvedValue("keep");

      const result = await step.execute(resolved, false);

      expect(result.shouldProceed).toBeFalsy();
      expect(result.cancelReason).toContain("keep current version");
    });

    it("prompts user when version is different and user cancels", async () => {
      const resolved: ResolvedPackage = {
        name: "vue",
        version: "3.2.0",
        wasSpecified: false,
        ageInDays: 14,
      };

      vi.mocked(select).mockResolvedValue("cancel");

      const result = await step.execute(resolved, false);

      expect(result.shouldProceed).toBeFalsy();
      expect(result.cancelReason).toContain("cancelled");
    });
  });

  describe("execute() - package exists in devDependencies", () => {
    beforeEach(() => {
      Object.assign(mockContext.devDependencies, {
        typescript: "4.9.0",
      });
    });

    it("detects package in devDependencies", async () => {
      const resolved: ResolvedPackage = {
        name: "typescript",
        version: "5.0.0",
        wasSpecified: false,
        ageInDays: 14,
      };

      vi.mocked(select).mockResolvedValue("update");

      const result = await step.execute(resolved, true);

      expect(result.shouldProceed).toBeTruthy();
      expect(result.package?.existing).toStrictEqual({
        exists: true,
        currentVersion: "4.9.0",
        location: "devDependencies",
      });
    });

    it("prompts when moving from devDependencies to dependencies", async () => {
      const resolved: ResolvedPackage = {
        name: "typescript",
        version: "4.9.0",
        wasSpecified: false,
        ageInDays: 14,
      };

      vi.mocked(select).mockResolvedValue("update");

      const result = await step.execute(resolved, false);

      expect(result.shouldProceed).toBeTruthy();
      expect(result.package?.saveDev).toBeFalsy();
      expect(result.package?.existing.location).toBe("devDependencies");
    });
  });

  describe("edge cases", () => {
    it("handles package existing in dependencies when adding to devDependencies", async () => {
      Object.assign(mockContext.dependencies, {
        lodash: "4.17.20",
      });

      const resolved: ResolvedPackage = {
        name: "lodash",
        version: "4.17.21",
        wasSpecified: false,
        ageInDays: 14,
      };

      vi.mocked(select).mockResolvedValue("update");

      const result = await step.execute(resolved, true);

      expect(result.shouldProceed).toBeTruthy();
      expect(result.package?.saveDev).toBeTruthy();
      expect(result.package?.existing).toStrictEqual({
        exists: true,
        currentVersion: "4.17.20",
        location: "dependencies",
      });
    });
  });
});
