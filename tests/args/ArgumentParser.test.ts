import { describe, it, expect } from "vitest";
import { ArgumentParser } from "../../src/args/ArgumentParser";
import { InvalidFormatError, MissingValueError } from "../../src/args/errors";
import { DEFAULT_SCRIPTS, SAFETY_BUFFER_DAYS } from "../../src/defaults";

describe("ArgumentParser", () => {
  describe("parse()", () => {
    it("returns default options when no args provided", () => {
      const parser = new ArgumentParser([]);
      const options = parser.parse();

      expect(options.days).toBe(SAFETY_BUFFER_DAYS);
      expect(options.scripts).toEqual(DEFAULT_SCRIPTS);
    });

    it("parses --days with valid number", () => {
      const parser = new ArgumentParser(["--days", "14"]);
      const options = parser.parse();

      expect(options.days).toBe(14);
    });

    it("parses -d short flag correctly", () => {
      const parser = new ArgumentParser(["-d", "21"]);
      const options = parser.parse();

      expect(options.days).toBe(21);
    });

    it("parses --lint with custom script name", () => {
      const parser = new ArgumentParser(["--lint", "lint:check"]);
      const options = parser.parse();

      expect(options.scripts.lint).toBe("lint:check");
    });

    it("parses --typecheck with custom script name", () => {
      const parser = new ArgumentParser(["--typecheck", "check-types"]);
      const options = parser.parse();

      expect(options.scripts.typecheck).toBe("check-types");
    });

    it("parses --test with custom script name", () => {
      const parser = new ArgumentParser(["--test", "test:unit"]);
      const options = parser.parse();

      expect(options.scripts.test).toBe("test:unit");
    });

    it("parses --build with custom script name", () => {
      const parser = new ArgumentParser(["--build", "build:prod"]);
      const options = parser.parse();

      expect(options.scripts.build).toBe("build:prod");
    });

    it("parses multiple options together", () => {
      const parser = new ArgumentParser([
        "--days", "30",
        "--lint", "eslint",
        "--test", "jest",
      ]);
      const options = parser.parse();

      expect(options.days).toBe(30);
      expect(options.scripts.lint).toBe("eslint");
      expect(options.scripts.test).toBe("jest");
      expect(options.scripts.typecheck).toBe(DEFAULT_SCRIPTS.typecheck);
      expect(options.scripts.build).toBe(DEFAULT_SCRIPTS.build);
    });

    it("throws InvalidFormatError for non-numeric days", () => {
      const parser = new ArgumentParser(["--days", "abc"]);

      expect(() => parser.parse()).toThrow(InvalidFormatError);
    });

    it("throws MissingValueError when days value is missing", () => {
      const parser = new ArgumentParser(["--days"]);

      expect(() => parser.parse()).toThrow(MissingValueError);
    });

    it("throws MissingValueError when days value looks like a flag", () => {
      const parser = new ArgumentParser(["--days", "--lint"]);

      expect(() => parser.parse()).toThrow(MissingValueError);
    });

    it("throws MissingValueError for negative days (treated as flag)", () => {
      // -5 starts with "-" so it's treated as a flag, not a value
      const parser = new ArgumentParser(["--days", "-5"]);

      expect(() => parser.parse()).toThrow(MissingValueError);
    });
  });

  describe("hasFlag()", () => {
    it("returns true when flag exists", () => {
      const parser = new ArgumentParser(["--help"]);

      expect(parser.hasFlag("--help")).toBe(true);
    });

    it("returns false when flag does not exist", () => {
      const parser = new ArgumentParser(["--days", "7"]);

      expect(parser.hasFlag("--help")).toBe(false);
    });

    it("returns true if any of multiple flags exist", () => {
      const parser = new ArgumentParser(["-h"]);

      expect(parser.hasFlag("--help", "-h")).toBe(true);
    });

    it("returns false when none of multiple flags exist", () => {
      const parser = new ArgumentParser(["--days", "7"]);

      expect(parser.hasFlag("--help", "-h")).toBe(false);
    });
  });
});
