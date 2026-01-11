import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  EXIT_CODE_CANCELLED,
  EXIT_CODE_ERROR,
  CLIError,
  UserCancellationError,
  isCLIError,
  isPromptCancellation,
  withCancellationHandling,
  isUserCancellation,
  logCancellation,
  handleFatalError,
} from "../index";

// Mock logger
vi.mock("../../logger", () => ({
  logger: {
    info: vi.fn(),
  },
}));

describe("errors module", () => {
  describe("constants", () => {
    it("EXIT_CODE_CANCELLED is 130", () => {
      expect(EXIT_CODE_CANCELLED).toBe(130);
    });

    it("EXIT_CODE_ERROR is 1", () => {
      expect(EXIT_CODE_ERROR).toBe(1);
    });
  });

  describe("CLIError", () => {
    it("creates error with message", () => {
      const error = new CLIError("test message");

      expect(error.message).toBe("test message");
      expect(error.name).toBe("CLIError");
    });

    it("is instance of Error", () => {
      const error = new CLIError("test");

      expect(error).toBeInstanceOf(Error);
    });

    it("supports cause option", () => {
      const cause = new Error("original error");
      const error = new CLIError("wrapped", { cause });

      expect(error.cause).toBe(cause);
    });
  });

  describe("isCLIError()", () => {
    it("returns true for CLIError", () => {
      expect(isCLIError(new CLIError("test"))).toBeTruthy();
    });

    it("returns true for CLIError subclass", () => {
      expect(isCLIError(new UserCancellationError())).toBeTruthy();
    });

    it("returns false for regular Error", () => {
      expect(isCLIError(new Error("test"))).toBeFalsy();
    });

    it("returns false for non-error values", () => {
      expect(isCLIError(null)).toBeFalsy();
      expect(isCLIError(undefined)).toBeFalsy();
      expect(isCLIError("string")).toBeFalsy();
      expect(isCLIError({})).toBeFalsy();
    });
  });

  describe("UserCancellationError", () => {
    it("creates error with default message", () => {
      const error = new UserCancellationError();

      expect(error.message).toBe("Operation cancelled by user");
      expect(error.name).toBe("UserCancellationError");
    });

    it("is instance of CLIError", () => {
      const error = new UserCancellationError();

      expect(error).toBeInstanceOf(CLIError);
    });

    it("stores cause when provided", () => {
      const cause = new Error("prompt error");
      const error = new UserCancellationError(cause);

      expect(error.cause).toBe(cause);
    });
  });

  describe("isPromptCancellation()", () => {
    it("returns true for ExitPromptError", () => {
      const error = new Error("test");
      error.name = "ExitPromptError";

      expect(isPromptCancellation(error)).toBeTruthy();
    });

    it("returns true for force closed message", () => {
      const error = new Error("User force closed the prompt");

      expect(isPromptCancellation(error)).toBeTruthy();
    });

    it("returns false for regular errors", () => {
      expect(isPromptCancellation(new Error("test"))).toBeFalsy();
    });

    it("returns false for non-error values", () => {
      expect(isPromptCancellation(null)).toBeFalsy();
      expect(isPromptCancellation("string")).toBeFalsy();
    });
  });

  describe("withCancellationHandling()", () => {
    it("returns result when function succeeds", async () => {
      const result = await withCancellationHandling(async () => "success");

      expect(result).toBe("success");
    });

    it("throws UserCancellationError for ExitPromptError", async () => {
      const promptError = new Error("test");
      promptError.name = "ExitPromptError";

      await expect(
        withCancellationHandling(async () => {
          throw promptError;
        })
      ).rejects.toThrow(UserCancellationError);
    });

    it("throws UserCancellationError for force closed", async () => {
      await expect(
        withCancellationHandling(async () => {
          throw new Error("User force closed the prompt");
        })
      ).rejects.toThrow(UserCancellationError);
    });

    it("preserves original error as cause", async () => {
      const promptError = new Error("original");
      promptError.name = "ExitPromptError";

      try {
        await withCancellationHandling(async () => {
          throw promptError;
        });
      } catch (error) {
        expect(error).toBeInstanceOf(UserCancellationError);
        expect((error as UserCancellationError).cause).toBe(promptError);
      }
    });

    it("re-throws non-cancellation errors", async () => {
      const regularError = new Error("regular error");

      await expect(
        withCancellationHandling(async () => {
          throw regularError;
        })
      ).rejects.toBe(regularError);
    });

    it("handles non-Error thrown values", async () => {
      const promptError = new Error("test");
      promptError.name = "ExitPromptError";

      // Should still work when error doesn't match and is non-Error
      await expect(
        withCancellationHandling(async () => {
          throw "string error";
        })
      ).rejects.toBe("string error");
    });
  });

  describe("isUserCancellation()", () => {
    it("returns true for UserCancellationError", () => {
      expect(isUserCancellation(new UserCancellationError())).toBeTruthy();
    });

    it("returns false for CLIError", () => {
      expect(isUserCancellation(new CLIError("test"))).toBeFalsy();
    });

    it("returns false for regular Error", () => {
      expect(isUserCancellation(new Error("test"))).toBeFalsy();
    });

    it("returns false for non-error values", () => {
      expect(isUserCancellation(null)).toBeFalsy();
      expect(isUserCancellation(undefined)).toBeFalsy();
    });
  });

  describe("logCancellation()", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("logs cancellation messages", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const { logger } = await import("../../logger");

      logCancellation();

      expect(consoleSpy).toHaveBeenCalledWith("\n");
      expect(logger.info).toHaveBeenCalledWith("Operation cancelled by user");
      expect(logger.info).toHaveBeenCalledWith("No changes were made to your dependencies.");

      consoleSpy.mockRestore();
    });
  });

  describe("handleFatalError()", () => {
    let mockExit: ReturnType<typeof vi.spyOn>;
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
        throw new Error("process.exit");
      });
      consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      mockExit.mockRestore();
      consoleSpy.mockRestore();
    });

    it("logs error message and exits with code 1", () => {
      const error = new Error("test error");

      expect(() => handleFatalError(error)).toThrow("process.exit");
      expect(consoleSpy).toHaveBeenCalledWith("\nFatal error: test error");
      expect(mockExit).toHaveBeenCalledWith(EXIT_CODE_ERROR);
    });

    it("handles non-Error values", () => {
      expect(() => handleFatalError("string error")).toThrow("process.exit");
      expect(consoleSpy).toHaveBeenCalledWith("\nFatal error: string error");
    });

    it("converts objects to string", () => {
      expect(() => handleFatalError({ foo: "bar" })).toThrow("process.exit");
      expect(consoleSpy).toHaveBeenCalledWith("\nFatal error: [object Object]");
    });
  });
});
