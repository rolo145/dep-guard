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

import { TypeCheckConfirmation } from "../TypeCheckConfirmation";
import { logger } from "../../../logger";

describe("TypeCheckConfirmation", () => {
  let confirmation: TypeCheckConfirmation;

  beforeEach(() => {
    vi.clearAllMocks();
    confirmation = new TypeCheckConfirmation();
    mockWithCancellationHandling.mockImplementation((fn) => fn());
  });

  describe("showHeader()", () => {
    it("displays type check header", () => {
      confirmation.showHeader();

      expect(logger.header).toHaveBeenCalledWith("Running type checks", "🔍");
    });
  });

  describe("showScriptName()", () => {
    it("displays script name", () => {
      confirmation.showScriptName("typecheck");

      expect(logger.info).toHaveBeenCalled();
    });
  });

  describe("showScriptNotFound()", () => {
    it("shows skip message with script name", () => {
      confirmation.showScriptNotFound("typecheck");

      expect(logger.skip).toHaveBeenCalledWith('Skipping type checks (script "typecheck" not found)');
    });
  });

  describe("confirmRun()", () => {
    it("prompts user for confirmation", async () => {
      mockConfirm.mockResolvedValue(true);

      await confirmation.confirmRun("typecheck");

      expect(mockWithCancellationHandling).toHaveBeenCalled();
    });

    it("returns true when user confirms", async () => {
      mockConfirm.mockResolvedValue(true);

      const result = await confirmation.confirmRun("typecheck");

      expect(result).toBeTruthy();
    });

    it("returns false when user declines", async () => {
      mockConfirm.mockResolvedValue(false);

      const result = await confirmation.confirmRun("typecheck");

      expect(result).toBeFalsy();
    });

    it("shows skip message when user declines", async () => {
      mockConfirm.mockResolvedValue(false);

      await confirmation.confirmRun("typecheck");

      expect(logger.skip).toHaveBeenCalledWith("Skipping type checks");
    });

    it("does not show skip message when user confirms", async () => {
      mockConfirm.mockResolvedValue(true);

      await confirmation.confirmRun("typecheck");

      expect(logger.skip).not.toHaveBeenCalled();
    });
  });

  describe("showProgress()", () => {
    it("creates spinner with message", () => {
      confirmation.showProgress();

      expect(logger.spinner).toHaveBeenCalledWith("Running type checks...");
    });

    it("returns spinner instance", () => {
      const result = confirmation.showProgress();

      expect(result).toBe(mockSpinner);
    });
  });

  describe("showSuccess()", () => {
    it("updates spinner with success", () => {
      confirmation.showSuccess(mockSpinner as ReturnType<typeof logger.spinner>);

      expect(mockSpinner.succeed).toHaveBeenCalledWith("Type checks passed");
    });
  });

  describe("showFailure()", () => {
    it("updates spinner with failure", () => {
      confirmation.showFailure(mockSpinner as ReturnType<typeof logger.spinner>);

      expect(mockSpinner.fail).toHaveBeenCalledWith("Type checks failed");
    });

    it("shows warning message", () => {
      confirmation.showFailure(mockSpinner as ReturnType<typeof logger.spinner>);

      expect(logger.warning).toHaveBeenCalledWith(
        "Type errors detected. Please review and fix them."
      );
    });
  });
});
