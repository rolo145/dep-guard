import { describe, it, expect } from "vitest";
import {
  RegistryError,
  RegistryFetchError,
  RegistryParseError,
  NoSafeVersionError,
} from "../errors";
import { CLIError } from "../../errors";

describe("NCU errors", () => {
  describe("RegistryError", () => {
    it("creates error with package name and message", () => {
      const error = new RegistryError("lodash", "Something went wrong");

      expect(error.message).toBe("Something went wrong");
      expect(error.packageName).toBe("lodash");
      expect(error.name).toBe("RegistryError");
    });

    it("is instance of CLIError", () => {
      const error = new RegistryError("lodash", "test");

      expect(error).toBeInstanceOf(CLIError);
    });

    it("is instance of Error", () => {
      const error = new RegistryError("lodash", "test");

      expect(error).toBeInstanceOf(Error);
    });

    it("supports cause option", () => {
      const cause = new Error("original");
      const error = new RegistryError("lodash", "wrapped", { cause });

      expect(error.cause).toBe(cause);
    });
  });

  describe("RegistryFetchError", () => {
    it("creates error with status code", () => {
      const error = new RegistryFetchError("lodash", 404);

      expect(error.message).toBe("Failed to fetch lodash from NPM registry (HTTP 404)");
      expect(error.packageName).toBe("lodash");
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe("RegistryFetchError");
    });

    it("creates error without status code", () => {
      const error = new RegistryFetchError("lodash");

      expect(error.message).toBe("Failed to fetch lodash from NPM registry");
      expect(error.statusCode).toBeUndefined();
    });

    it("is instance of RegistryError", () => {
      const error = new RegistryFetchError("lodash", 500);

      expect(error).toBeInstanceOf(RegistryError);
    });

    it("is instance of CLIError", () => {
      const error = new RegistryFetchError("lodash", 500);

      expect(error).toBeInstanceOf(CLIError);
    });

    it("supports cause option", () => {
      const cause = new Error("network error");
      const error = new RegistryFetchError("lodash", 500, { cause });

      expect(error.cause).toBe(cause);
    });
  });

  describe("RegistryParseError", () => {
    it("creates error with package name", () => {
      const error = new RegistryParseError("lodash");

      expect(error.message).toBe("Failed to parse registry response for lodash");
      expect(error.packageName).toBe("lodash");
      expect(error.name).toBe("RegistryParseError");
    });

    it("is instance of RegistryError", () => {
      const error = new RegistryParseError("lodash");

      expect(error).toBeInstanceOf(RegistryError);
    });

    it("is instance of CLIError", () => {
      const error = new RegistryParseError("lodash");

      expect(error).toBeInstanceOf(CLIError);
    });

    it("supports cause option", () => {
      const cause = new Error("JSON parse error");
      const error = new RegistryParseError("lodash", { cause });

      expect(error.cause).toBe(cause);
    });
  });

  describe("NoSafeVersionError", () => {
    it("creates error with package name and days", () => {
      const error = new NoSafeVersionError("lodash", 7);

      expect(error.message).toBe("No version of lodash published at least 7 days ago");
      expect(error.packageName).toBe("lodash");
      expect(error.days).toBe(7);
      expect(error.name).toBe("NoSafeVersionError");
    });

    it("is instance of RegistryError", () => {
      const error = new NoSafeVersionError("lodash", 7);

      expect(error).toBeInstanceOf(RegistryError);
    });

    it("is instance of CLIError", () => {
      const error = new NoSafeVersionError("lodash", 7);

      expect(error).toBeInstanceOf(CLIError);
    });

    it("handles different day values", () => {
      const error14 = new NoSafeVersionError("lodash", 14);
      const error30 = new NoSafeVersionError("express", 30);

      expect(error14.days).toBe(14);
      expect(error14.message).toContain("14 days");
      expect(error30.days).toBe(30);
      expect(error30.message).toContain("30 days");
    });
  });
});
