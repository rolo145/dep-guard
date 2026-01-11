import { describe, it, expect } from "vitest";
import {
  ValidationError,
  MissingValueError,
  InvalidFormatError,
  OutOfRangeError,
} from "../errors";

describe("Argument Errors", () => {
  describe("ValidationError", () => {
    it("creates error with flag and message", () => {
      const error = new ValidationError("--test", "test error message");

      expect(error.name).toBe("ValidationError");
      expect(error.flag).toBe("--test");
      expect(error.message).toBe("test error message");
    });

    it("is an instance of Error", () => {
      const error = new ValidationError("--test", "message");
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe("MissingValueError", () => {
    it("creates error with formatted message", () => {
      const error = new MissingValueError("--days", "a number");

      expect(error.name).toBe("MissingValueError");
      expect(error.flag).toBe("--days");
      expect(error.expectedType).toBe("a number");
      expect(error.message).toBe("--days requires a number");
    });

    it("is an instance of ValidationError", () => {
      const error = new MissingValueError("--days", "a number");
      expect(error).toBeInstanceOf(ValidationError);
    });
  });

  describe("InvalidFormatError", () => {
    it("creates error with formatted message", () => {
      const error = new InvalidFormatError("--days", "abc", "a positive number");

      expect(error.name).toBe("InvalidFormatError");
      expect(error.flag).toBe("--days");
      expect(error.value).toBe("abc");
      expect(error.expectedFormat).toBe("a positive number");
      expect(error.message).toBe('--days has invalid format: "abc". Expected: a positive number');
    });

    it("is an instance of ValidationError", () => {
      const error = new InvalidFormatError("--days", "abc", "a number");
      expect(error).toBeInstanceOf(ValidationError);
    });
  });

  describe("OutOfRangeError", () => {
    it("creates error with min constraint", () => {
      const error = new OutOfRangeError("--days", -5, 0);

      expect(error.name).toBe("OutOfRangeError");
      expect(error.flag).toBe("--days");
      expect(error.value).toBe(-5);
      expect(error.min).toBe(0);
      expect(error.max).toBeUndefined();
      expect(error.message).toBe("--days value -5 is out of range (must be at least 0)");
    });

    it("creates error with max constraint", () => {
      const error = new OutOfRangeError("--days", 500, undefined, 365);

      expect(error.value).toBe(500);
      expect(error.min).toBeUndefined();
      expect(error.max).toBe(365);
      expect(error.message).toBe("--days value 500 is out of range (must be at most 365)");
    });

    it("creates error with both min and max constraints", () => {
      const error = new OutOfRangeError("--days", 500, 0, 365);

      expect(error.min).toBe(0);
      expect(error.max).toBe(365);
      expect(error.message).toBe("--days value 500 is out of range (must be between 0 and 365)");
    });

    it("creates error without constraints", () => {
      const error = new OutOfRangeError("--days", -5);

      expect(error.message).toBe("--days value -5 is out of range");
    });

    it("is an instance of ValidationError", () => {
      const error = new OutOfRangeError("--days", -5, 0);
      expect(error).toBeInstanceOf(ValidationError);
    });
  });
});
