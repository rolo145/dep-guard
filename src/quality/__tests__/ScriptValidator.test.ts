import { describe, it, expect, vi, beforeEach } from "vitest";

const mockHasScript = vi.fn();

vi.mock("../../context/PackageJsonReader", () => ({
  PackageJsonReader: class {
    hasScript = mockHasScript;
  },
}));

vi.mock("../../logger", () => ({
  logger: {
    warning: vi.fn(),
    info: vi.fn(),
    newLine: vi.fn(),
  },
}));

import { ScriptValidator, ScriptNames } from "../ScriptValidator";
import { logger } from "../../logger";

describe("ScriptValidator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validate()", () => {
    it("returns all true when all scripts exist", () => {
      mockHasScript.mockReturnValue(true);

      const scriptNames: ScriptNames = {
        lint: "lint",
        typecheck: "typecheck",
        test: "test",
        build: "build",
      };

      const result = ScriptValidator.validate(scriptNames);

      expect(result).toEqual({
        lint: true,
        typecheck: true,
        test: true,
        build: true,
      });
    });

    it("returns all false when no scripts exist", () => {
      mockHasScript.mockReturnValue(false);

      const scriptNames: ScriptNames = {
        lint: "lint",
        typecheck: "typecheck",
        test: "test",
        build: "build",
      };

      const result = ScriptValidator.validate(scriptNames);

      expect(result).toEqual({
        lint: false,
        typecheck: false,
        test: false,
        build: false,
      });
    });

    it("returns mixed results when some scripts exist", () => {
      mockHasScript
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      const scriptNames: ScriptNames = {
        lint: "lint",
        typecheck: "typecheck",
        test: "test",
        build: "build",
      };

      const result = ScriptValidator.validate(scriptNames);

      expect(result).toEqual({
        lint: true,
        typecheck: false,
        test: true,
        build: false,
      });
    });

    it("checks scripts with correct names", () => {
      mockHasScript.mockReturnValue(true);

      const scriptNames: ScriptNames = {
        lint: "custom-lint",
        typecheck: "custom-typecheck",
        test: "custom-test",
        build: "custom-build",
      };

      ScriptValidator.validate(scriptNames);

      expect(mockHasScript).toHaveBeenCalledWith("custom-lint");
      expect(mockHasScript).toHaveBeenCalledWith("custom-typecheck");
      expect(mockHasScript).toHaveBeenCalledWith("custom-test");
      expect(mockHasScript).toHaveBeenCalledWith("custom-build");
    });

    it("shows warning when scripts are missing", () => {
      mockHasScript.mockReturnValue(false);

      const scriptNames: ScriptNames = {
        lint: "lint",
        typecheck: "typecheck",
        test: "test",
        build: "build",
      };

      ScriptValidator.validate(scriptNames);

      expect(logger.warning).toHaveBeenCalledWith(
        "The following scripts were not found in package.json:"
      );
    });

    it("lists each missing script", () => {
      mockHasScript
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      const scriptNames: ScriptNames = {
        lint: "lint",
        typecheck: "typecheck",
        test: "test",
        build: "build",
      };

      ScriptValidator.validate(scriptNames);

      expect(logger.info).toHaveBeenCalledWith('  - typecheck: "typecheck"');
      expect(logger.info).toHaveBeenCalledWith('  - build: "build"');
    });

    it("does not show warning when all scripts exist", () => {
      mockHasScript.mockReturnValue(true);

      const scriptNames: ScriptNames = {
        lint: "lint",
        typecheck: "typecheck",
        test: "test",
        build: "build",
      };

      ScriptValidator.validate(scriptNames);

      expect(logger.warning).not.toHaveBeenCalled();
    });

    it("shows usage hint when scripts are missing", () => {
      mockHasScript.mockReturnValue(false);

      const scriptNames: ScriptNames = {
        lint: "lint",
        typecheck: "typecheck",
        test: "test",
        build: "build",
      };

      ScriptValidator.validate(scriptNames);

      expect(logger.info).toHaveBeenCalledWith(
        "These quality checks will be skipped. Use --lint, --typecheck, --test, --build to specify custom script names."
      );
    });

    it("adds newline after missing scripts message", () => {
      mockHasScript.mockReturnValue(false);

      const scriptNames: ScriptNames = {
        lint: "lint",
        typecheck: "typecheck",
        test: "test",
        build: "build",
      };

      ScriptValidator.validate(scriptNames);

      expect(logger.newLine).toHaveBeenCalled();
    });
  });
});
