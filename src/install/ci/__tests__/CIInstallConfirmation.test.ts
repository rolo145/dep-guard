import { describe, it, expect, vi, beforeEach } from "vitest";
import { CIInstallConfirmation } from "../CIInstallConfirmation";
import { logger } from "../../../logger";
import * as inquirer from "@inquirer/prompts";
import * as errors from "../../../errors";

// Mock dependencies
vi.mock("../../../logger");
vi.mock("@inquirer/prompts");
vi.mock("../../../errors");

describe("CIInstallConfirmation", () => {
  let confirmation: CIInstallConfirmation;
  let mockSpinner: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSpinner = {
      succeed: vi.fn(),
      fail: vi.fn(),
    };

    vi.mocked(logger.spinner).mockReturnValue(mockSpinner);

    confirmation = new CIInstallConfirmation();
  });

  describe("showHeader()", () => {
    it("displays reinstall header", () => {
      confirmation.showHeader();

      expect(logger.header).toHaveBeenCalledWith("Reinstalling dependencies", "📦");
    });
  });

  describe("confirmRun()", () => {
    it("prompts user for confirmation", async () => {
      vi.mocked(errors.withCancellationHandling).mockImplementation(async (fn) => fn());
      vi.mocked(inquirer.confirm).mockResolvedValue(true);

      const result = await confirmation.confirmRun();

      expect(inquirer.confirm).toHaveBeenCalledWith({
        message: "Do you want to reinstall dependencies with npm ci?",
        default: false,
      });
      expect(result).toBe(true);
    });

    it("returns true when user confirms", async () => {
      vi.mocked(errors.withCancellationHandling).mockImplementation(async (fn) => fn());
      vi.mocked(inquirer.confirm).mockResolvedValue(true);

      const result = await confirmation.confirmRun();

      expect(result).toBe(true);
      expect(logger.skip).not.toHaveBeenCalled();
    });

    it("returns false and shows skip message when user declines", async () => {
      vi.mocked(errors.withCancellationHandling).mockImplementation(async (fn) => fn());
      vi.mocked(inquirer.confirm).mockResolvedValue(false);

      const result = await confirmation.confirmRun();

      expect(result).toBe(false);
      expect(logger.skip).toHaveBeenCalledWith("Skipping npm ci");
    });

    it("wraps prompt with cancellation handling", async () => {
      vi.mocked(errors.withCancellationHandling).mockImplementation(async (fn) => fn());
      vi.mocked(inquirer.confirm).mockResolvedValue(true);

      await confirmation.confirmRun();

      expect(errors.withCancellationHandling).toHaveBeenCalledOnce();
    });
  });

  describe("showProgress()", () => {
    it("creates and returns spinner with reinstall message", () => {
      const result = confirmation.showProgress();

      expect(logger.spinner).toHaveBeenCalledWith("Reinstalling dependencies via npm ci...");
      expect(result).toBe(mockSpinner);
    });
  });

  describe("showSuccess()", () => {
    it("marks spinner as succeeded", () => {
      confirmation.showSuccess(mockSpinner);

      expect(mockSpinner.succeed).toHaveBeenCalledWith("Dependencies reinstalled successfully");
    });
  });

  describe("showFailure()", () => {
    it("marks spinner as failed and shows error", () => {
      confirmation.showFailure(mockSpinner);

      expect(mockSpinner.fail).toHaveBeenCalledWith("Failed to reinstall dependencies");
      expect(logger.error).toHaveBeenCalledWith("Update process aborted");
    });
  });
});
