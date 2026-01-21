import { describe, it, expect, vi, beforeEach } from "vitest";

const mockConfirm = vi.fn();
const mockWithCancellationHandling = vi.fn();

vi.mock("@inquirer/prompts", () => ({
  confirm: (...args: unknown[]) => mockConfirm(...args),
}));

vi.mock("../../../errors", () => ({
  withCancellationHandling: (fn: () => unknown) => mockWithCancellationHandling(fn),
}));

const mockSpinner = {
  succeed: vi.fn(),
  fail: vi.fn(),
};

vi.mock("../../../logger", () => ({
  logger: {
    header: vi.fn(),
    info: vi.fn(),
    skip: vi.fn(),
    warning: vi.fn(),
    spinner: vi.fn(() => mockSpinner),
  },
}));

import { BuildConfirmation } from "../BuildConfirmation";
import { logger } from "../../../logger";

describe("BuildConfirmation", () => {
  let confirmation: BuildConfirmation;

  beforeEach(() => {
    vi.clearAllMocks();
    confirmation = new BuildConfirmation();
    mockWithCancellationHandling.mockImplementation((fn) => fn());
  });

  describe("showHeader()", () => {
    it("displays build header", () => {
      confirmation.showHeader();

      expect(logger.header).toHaveBeenCalledWith("Running build", "🏗️");
    });
  });

  describe("showScriptName()", () => {
    it("displays script name", () => {
      confirmation.showScriptName("build");

      expect(logger.info).toHaveBeenCalled();
    });
  });

  describe("showScriptNotFound()", () => {
    it("shows skip message with script name", () => {
      confirmation.showScriptNotFound("build");

      expect(logger.skip).toHaveBeenCalledWith('Skipping build (script "build" not found)');
    });
  });

  describe("confirmRun()", () => {
    it("prompts user for confirmation", async () => {
      mockConfirm.mockResolvedValue(true);

      await confirmation.confirmRun("build");

      expect(mockWithCancellationHandling).toHaveBeenCalled();
    });

    it("returns true when user confirms", async () => {
      mockConfirm.mockResolvedValue(true);

      const result = await confirmation.confirmRun("build");

      expect(result).toBeTruthy();
    });

    it("returns false when user declines", async () => {
      mockConfirm.mockResolvedValue(false);

      const result = await confirmation.confirmRun("build");

      expect(result).toBeFalsy();
    });

    it("shows skip message when user declines", async () => {
      mockConfirm.mockResolvedValue(false);

      await confirmation.confirmRun("build");

      expect(logger.skip).toHaveBeenCalledWith("Skipping build");
    });

    it("does not show skip message when user confirms", async () => {
      mockConfirm.mockResolvedValue(true);

      await confirmation.confirmRun("build");

      expect(logger.skip).not.toHaveBeenCalled();
    });
  });

  describe("showProgress()", () => {
    it("creates spinner with message", () => {
      confirmation.showProgress();

      expect(logger.spinner).toHaveBeenCalledWith("Building...");
    });

    it("returns spinner instance", () => {
      const result = confirmation.showProgress();

      expect(result).toBe(mockSpinner);
    });
  });

  describe("showSuccess()", () => {
    it("updates spinner with success", () => {
      confirmation.showSuccess(mockSpinner as unknown as ReturnType<typeof logger.spinner>);

      expect(mockSpinner.succeed).toHaveBeenCalledWith("Build complete!");
    });
  });

  describe("showFailure()", () => {
    it("updates spinner with failure", () => {
      confirmation.showFailure(mockSpinner as unknown as ReturnType<typeof logger.spinner>);

      expect(mockSpinner.fail).toHaveBeenCalledWith("Build failed");
    });

    it("shows warning message", () => {
      confirmation.showFailure(mockSpinner as unknown as ReturnType<typeof logger.spinner>);

      expect(logger.warning).toHaveBeenCalledWith(
        "Build errors detected. Please review and fix them."
      );
    });
  });
});
