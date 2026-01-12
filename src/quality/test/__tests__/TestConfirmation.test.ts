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

import { TestConfirmation } from "../TestConfirmation";
import { logger } from "../../../logger";

describe("TestConfirmation", () => {
  let confirmation: TestConfirmation;

  beforeEach(() => {
    vi.clearAllMocks();
    confirmation = new TestConfirmation();
    mockWithCancellationHandling.mockImplementation((fn) => fn());
  });

  describe("showHeader()", () => {
    it("displays test header", () => {
      confirmation.showHeader();

      expect(logger.header).toHaveBeenCalledWith("Running tests", "🧪");
    });
  });

  describe("showScriptName()", () => {
    it("displays script name", () => {
      confirmation.showScriptName("test");

      expect(logger.info).toHaveBeenCalled();
    });
  });

  describe("showScriptNotFound()", () => {
    it("shows skip message with script name", () => {
      confirmation.showScriptNotFound("test");

      expect(logger.skip).toHaveBeenCalledWith('Skipping tests (script "test" not found)');
    });
  });

  describe("confirmRun()", () => {
    it("prompts user for confirmation", async () => {
      mockConfirm.mockResolvedValue(true);

      await confirmation.confirmRun("test");

      expect(mockWithCancellationHandling).toHaveBeenCalled();
    });

    it("returns true when user confirms", async () => {
      mockConfirm.mockResolvedValue(true);

      const result = await confirmation.confirmRun("test");

      expect(result).toBe(true);
    });

    it("returns false when user declines", async () => {
      mockConfirm.mockResolvedValue(false);

      const result = await confirmation.confirmRun("test");

      expect(result).toBe(false);
    });

    it("shows skip message when user declines", async () => {
      mockConfirm.mockResolvedValue(false);

      await confirmation.confirmRun("test");

      expect(logger.skip).toHaveBeenCalledWith("Skipping tests");
    });

    it("does not show skip message when user confirms", async () => {
      mockConfirm.mockResolvedValue(true);

      await confirmation.confirmRun("test");

      expect(logger.skip).not.toHaveBeenCalled();
    });
  });

  describe("showProgress()", () => {
    it("creates spinner with message", () => {
      confirmation.showProgress();

      expect(logger.spinner).toHaveBeenCalledWith("Running tests...");
    });

    it("returns spinner instance", () => {
      const result = confirmation.showProgress();

      expect(result).toBe(mockSpinner);
    });
  });

  describe("showSuccess()", () => {
    it("updates spinner with success", () => {
      confirmation.showSuccess(mockSpinner as ReturnType<typeof logger.spinner>);

      expect(mockSpinner.succeed).toHaveBeenCalledWith("Tests passed");
    });
  });

  describe("showFailure()", () => {
    it("updates spinner with failure", () => {
      confirmation.showFailure(mockSpinner as ReturnType<typeof logger.spinner>);

      expect(mockSpinner.fail).toHaveBeenCalledWith("Tests failed");
    });

    it("shows warning message", () => {
      confirmation.showFailure(mockSpinner as ReturnType<typeof logger.spinner>);

      expect(logger.warning).toHaveBeenCalledWith(
        "Some tests failed. Please review and fix them."
      );
    });
  });
});
