import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../logger", () => ({
  logger: {
    warning: vi.fn(),
    success: vi.fn(),
  },
}));

import { QualityConfirmation } from "../QualityConfirmation";
import { QualityCheckResults } from "../QualityRunner";
import { logger } from "../../logger";

describe("QualityConfirmation", () => {
  let confirmation: QualityConfirmation;

  beforeEach(() => {
    vi.clearAllMocks();
    confirmation = new QualityConfirmation();
  });

  describe("showSummary()", () => {
    it("shows success message when all checks pass", () => {
      const results: QualityCheckResults = {
        lint: true,
        typeCheck: true,
        tests: true,
      };

      confirmation.showSummary(results);

      expect(logger.success).toHaveBeenCalledWith("Quality checks complete!");
      expect(logger.warning).not.toHaveBeenCalled();
    });

    it("shows warning when lint fails", () => {
      const results: QualityCheckResults = {
        lint: false,
        typeCheck: true,
        tests: true,
      };

      confirmation.showSummary(results);

      expect(logger.warning).toHaveBeenCalledWith(
        "Quality checks completed with failures: lint"
      );
    });

    it("shows warning when type checks fail", () => {
      const results: QualityCheckResults = {
        lint: true,
        typeCheck: false,
        tests: true,
      };

      confirmation.showSummary(results);

      expect(logger.warning).toHaveBeenCalledWith(
        "Quality checks completed with failures: type checks"
      );
    });

    it("shows warning when tests fail", () => {
      const results: QualityCheckResults = {
        lint: true,
        typeCheck: true,
        tests: false,
      };

      confirmation.showSummary(results);

      expect(logger.warning).toHaveBeenCalledWith(
        "Quality checks completed with failures: tests"
      );
    });

    it("shows warning with multiple failures", () => {
      const results: QualityCheckResults = {
        lint: false,
        typeCheck: false,
        tests: false,
      };

      confirmation.showSummary(results);

      expect(logger.warning).toHaveBeenCalledWith(
        "Quality checks completed with failures: lint, type checks, tests"
      );
    });

    it("treats null as passing (skipped)", () => {
      const results: QualityCheckResults = {
        lint: null,
        typeCheck: null,
        tests: null,
      };

      confirmation.showSummary(results);

      expect(logger.success).toHaveBeenCalledWith("Quality checks complete!");
      expect(logger.warning).not.toHaveBeenCalled();
    });

    it("handles mixed results with skipped checks", () => {
      const results: QualityCheckResults = {
        lint: null,
        typeCheck: false,
        tests: true,
      };

      confirmation.showSummary(results);

      expect(logger.warning).toHaveBeenCalledWith(
        "Quality checks completed with failures: type checks"
      );
    });
  });
});
