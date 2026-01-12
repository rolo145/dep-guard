import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSpinner = {
  start: vi.fn().mockReturnThis(),
  stop: vi.fn().mockReturnThis(),
};

vi.mock("../../logger", () => ({
  logger: {
    spinner: vi.fn(() => mockSpinner),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    newLine: vi.fn(),
  },
}));

vi.mock("@inquirer/prompts", () => ({
  checkbox: vi.fn(),
}));

vi.mock("../../errors", () => ({
  withCancellationHandling: vi.fn((fn) => fn()),
}));

import { NCUConfirmation } from "../NCUConfirmation";
import { logger } from "../../logger";
import { checkbox } from "@inquirer/prompts";

describe("NCUConfirmation", () => {
  let confirmation: NCUConfirmation;

  beforeEach(() => {
    vi.clearAllMocks();
    confirmation = new NCUConfirmation();
  });

  describe("showQueryingUpdates()", () => {
    it("starts a spinner with correct message", () => {
      confirmation.showQueryingUpdates();

      expect(logger.spinner).toHaveBeenCalledWith("Querying npm-check-updates...");
    });

    it("returns the spinner instance", () => {
      const result = confirmation.showQueryingUpdates();

      expect(result).toBe(mockSpinner);
    });
  });

  describe("showNoUpdates()", () => {
    it("logs success message", () => {
      confirmation.showNoUpdates();

      expect(logger.success).toHaveBeenCalledWith("All dependencies are up to date!");
    });
  });

  describe("showPotentialUpdates()", () => {
    it("logs success message with count", () => {
      confirmation.showPotentialUpdates(10);

      expect(logger.success).toHaveBeenCalledWith("Found 10 potential updates");
    });

    it("handles zero count", () => {
      confirmation.showPotentialUpdates(0);

      expect(logger.success).toHaveBeenCalledWith("Found 0 potential updates");
    });
  });

  describe("showNoSafeUpdates()", () => {
    it("logs warning message with days", () => {
      confirmation.showNoSafeUpdates(7);

      expect(logger.warning).toHaveBeenCalledWith(
        "No updates available (all recent versions are less than 7 days old)"
      );
    });
  });

  describe("showSafeUpdates()", () => {
    it("logs success message with count", () => {
      confirmation.showSafeUpdates(5);

      expect(logger.success).toHaveBeenCalledWith("5 safe updates available");
    });
  });

  describe("showGroupSummary()", () => {
    it("logs info message with counts", () => {
      const grouped = {
        major: [{ name: "a", currentVersion: "1.0.0", newVersion: "2.0.0" }],
        minor: [
          { name: "b", currentVersion: "1.0.0", newVersion: "1.1.0" },
          { name: "c", currentVersion: "1.0.0", newVersion: "1.2.0" },
        ],
        patch: [{ name: "d", currentVersion: "1.0.0", newVersion: "1.0.1" }],
      };

      confirmation.showGroupSummary(grouped);

      expect(logger.info).toHaveBeenCalledWith("Major: 1, Minor: 2, Patch: 1");
      expect(logger.newLine).toHaveBeenCalled();
    });

    it("handles empty groups", () => {
      const grouped = { major: [], minor: [], patch: [] };

      confirmation.showGroupSummary(grouped);

      expect(logger.info).toHaveBeenCalledWith("Major: 0, Minor: 0, Patch: 0");
    });
  });

  describe("promptSelection()", () => {
    it("calls checkbox with correct options", async () => {
      const choices = [
        { name: "lodash", value: { name: "lodash", version: "5.0.0" }, checked: false },
      ];
      vi.mocked(checkbox).mockResolvedValue([{ name: "lodash", version: "5.0.0" }]);

      await confirmation.promptSelection(choices);

      expect(checkbox).toHaveBeenCalledWith({
        message: "Select packages to update (Space to select, Enter to confirm):",
        choices,
        loop: false,
        pageSize: 40,
      });
    });

    it("returns selected packages", async () => {
      const selected = [{ name: "lodash", version: "5.0.0" }];
      vi.mocked(checkbox).mockResolvedValue(selected);

      const result = await confirmation.promptSelection([]);

      expect(result).toEqual(selected);
    });
  });
});
