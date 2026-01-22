import { describe, it, expect, vi, beforeEach } from "vitest";
import { AddSecurityValidationStep } from "../AddSecurityValidationStep";
import type { PackageToAdd } from "../../add/types";
import type { NPQService } from "../../../npq";

// Mock dependencies
vi.mock("../../../logger", () => ({
  logger: {
    newLine: vi.fn(),
    warning: vi.fn(),
  },
}));

describe("AddSecurityValidationStep", () => {
  let step: AddSecurityValidationStep;
  let mockNpqService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockNpqService = {
      validateAndConfirm: vi.fn(),
    } as unknown as NPQService;

    step = new AddSecurityValidationStep(mockNpqService);
  });

  describe("execute()", () => {
    it("returns confirmed package when user confirms", async () => {
      const packageToAdd: PackageToAdd = {
        name: "vue",
        version: "3.2.0",
        wasSpecified: false,
        ageInDays: 14,
        saveDev: false,
        existing: {
          exists: false,
        },
      };

      mockNpqService.validateAndConfirm.mockResolvedValue(true);

      const result = await step.execute(packageToAdd);

      expect(result.confirmed).toBeTruthy();
      expect(result.package).toStrictEqual({
        ...packageToAdd,
        npqPassed: true,
        userConfirmed: true,
      });
      expect(mockNpqService.validateAndConfirm).toHaveBeenCalledWith("vue", "3.2.0");
    });

    it("returns not confirmed when user declines", async () => {
      const packageToAdd: PackageToAdd = {
        name: "vue",
        version: "3.2.0",
        wasSpecified: false,
        ageInDays: 14,
        saveDev: false,
        existing: {
          exists: false,
        },
      };

      mockNpqService.validateAndConfirm.mockResolvedValue(false);

      const result = await step.execute(packageToAdd);

      expect(result.confirmed).toBeFalsy();
      expect(result.cancelReason).toContain("did not confirm");
      expect(mockNpqService.validateAndConfirm).toHaveBeenCalledWith("vue", "3.2.0");
    });

    it("validates scoped packages correctly", async () => {
      const packageToAdd: PackageToAdd = {
        name: "@vue/cli",
        version: "5.0.0",
        wasSpecified: true,
        ageInDays: 30,
        saveDev: true,
        existing: {
          exists: false,
        },
      };

      mockNpqService.validateAndConfirm.mockResolvedValue(true);

      const result = await step.execute(packageToAdd);

      expect(result.confirmed).toBeTruthy();
      expect(mockNpqService.validateAndConfirm).toHaveBeenCalledWith("@vue/cli", "5.0.0");
    });

    it("handles existing package updates", async () => {
      const packageToAdd: PackageToAdd = {
        name: "lodash",
        version: "4.17.21",
        wasSpecified: false,
        ageInDays: 100,
        saveDev: false,
        existing: {
          exists: true,
          currentVersion: "4.17.20",
          location: "dependencies",
        },
      };

      mockNpqService.validateAndConfirm.mockResolvedValue(true);

      const result = await step.execute(packageToAdd);

      expect(result.confirmed).toBeTruthy();
      expect(result.package).toStrictEqual({
        ...packageToAdd,
        npqPassed: true,
        userConfirmed: true,
      });
    });
  });
});
