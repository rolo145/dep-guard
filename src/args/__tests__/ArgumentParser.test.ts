import { describe, it, expect } from "vitest";
import { ArgumentParser } from "../ArgumentParser";
import { InvalidFormatError, MissingValueError, IncompatibleFlagsError, InvalidFlagForCommandError } from "../errors";
import { DEFAULT_SCRIPTS, SAFETY_BUFFER_DAYS } from "../../defaults";

describe("ArgumentParser", () => {
  describe("parse()", () => {
    it("returns default options when no args provided", () => {
      const parser = new ArgumentParser([]);
      const options = parser.parse();

      expect(options.days).toBe(SAFETY_BUFFER_DAYS);
      expect(options.scripts).toStrictEqual(DEFAULT_SCRIPTS);
      expect(options.allowNpmInstall).toBeFalsy();
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

    it("parses --allow-npm-install flag", () => {
      const parser = new ArgumentParser(["--allow-npm-install"]);
      const options = parser.parse();

      expect(options.allowNpmInstall).toBeTruthy();
    });

    it("parses --allow-npm-install with other options", () => {
      const parser = new ArgumentParser(["--allow-npm-install", "--days", "14"]);
      const options = parser.parse();

      expect(options.allowNpmInstall).toBeTruthy();
      expect(options.days).toBe(14);
    });

    it("parses --dry-run flag", () => {
      const parser = new ArgumentParser(["--dry-run"]);
      const options = parser.parse();

      expect(options.dryRun).toBeTruthy();
    });

    it("defaults dryRun to false when not provided", () => {
      const parser = new ArgumentParser([]);
      const options = parser.parse();

      expect(options.dryRun).toBeFalsy();
    });

    it("parses --dry-run with other options", () => {
      const parser = new ArgumentParser(["--dry-run", "--days", "14"]);
      const options = parser.parse();

      expect(options.dryRun).toBeTruthy();
      expect(options.days).toBe(14);
    });

    it("parses --dry-run with --allow-npm-install", () => {
      const parser = new ArgumentParser(["--dry-run", "--allow-npm-install"]);
      const options = parser.parse();

      expect(options.dryRun).toBeTruthy();
      expect(options.allowNpmInstall).toBeTruthy();
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

      expect(parser.hasFlag("--help")).toBeTruthy();
    });

    it("returns false when flag does not exist", () => {
      const parser = new ArgumentParser(["--days", "7"]);

      expect(parser.hasFlag("--help")).toBeFalsy();
    });

    it("returns true if any of multiple flags exist", () => {
      const parser = new ArgumentParser(["-h"]);

      expect(parser.hasFlag("--help", "-h")).toBeTruthy();
    });

    it("returns false when none of multiple flags exist", () => {
      const parser = new ArgumentParser(["--days", "7"]);

      expect(parser.hasFlag("--help", "-h")).toBeFalsy();
    });
  });

  describe("parsePackageArgs()", () => {
    it("returns empty array when only flags present", () => {
      const parser = new ArgumentParser(["-D", "--allow-npm-install"]);
      const packages = parser.parsePackageArgs();

      expect(packages).toStrictEqual([]);
    });

    it("returns single package argument", () => {
      const parser = new ArgumentParser(["vue"]);
      const packages = parser.parsePackageArgs();

      expect(packages).toStrictEqual(["vue"]);
    });

    it("returns package with version", () => {
      const parser = new ArgumentParser(["vue@3.2.0"]);
      const packages = parser.parsePackageArgs();

      expect(packages).toStrictEqual(["vue@3.2.0"]);
    });

    it("returns scoped package", () => {
      const parser = new ArgumentParser(["@vue/cli"]);
      const packages = parser.parsePackageArgs();

      expect(packages).toStrictEqual(["@vue/cli"]);
    });

    it("returns scoped package with version", () => {
      const parser = new ArgumentParser(["@vue/cli@5.0.0"]);
      const packages = parser.parsePackageArgs();

      expect(packages).toStrictEqual(["@vue/cli@5.0.0"]);
    });

    it("returns package and filters out flags", () => {
      const parser = new ArgumentParser(["vue", "-D", "--allow-npm-install"]);
      const packages = parser.parsePackageArgs();

      expect(packages).toStrictEqual(["vue"]);
    });

    it("filters out flag values from --days", () => {
      const parser = new ArgumentParser(["vue", "--days", "7"]);
      const packages = parser.parsePackageArgs();

      expect(packages).toStrictEqual(["vue"]);
    });

    it("filters out flag values from -d", () => {
      const parser = new ArgumentParser(["vue", "-d", "14"]);
      const packages = parser.parsePackageArgs();

      expect(packages).toStrictEqual(["vue"]);
    });

    it("filters out flag values from --lint", () => {
      const parser = new ArgumentParser(["vue", "--lint", "eslint"]);
      const packages = parser.parsePackageArgs();

      expect(packages).toStrictEqual(["vue"]);
    });

    it("filters out multiple flag values", () => {
      const parser = new ArgumentParser(["vue", "--days", "7", "--lint", "eslint", "-D"]);
      const packages = parser.parsePackageArgs();

      expect(packages).toStrictEqual(["vue"]);
    });

    it("returns multiple packages when provided (for validation testing)", () => {
      // Note: CLI validates that only one package is provided
      // This test verifies that the parser itself doesn't reject multiple packages
      const parser = new ArgumentParser(["vue", "react"]);
      const packages = parser.parsePackageArgs();

      expect(packages).toStrictEqual(["vue", "react"]);
    });

    it("handles package as first argument followed by flags", () => {
      const parser = new ArgumentParser(["typescript", "-D", "--allow-npm-install"]);
      const packages = parser.parsePackageArgs();

      expect(packages).toStrictEqual(["typescript"]);
    });

    it("handles package with flags and flag values mixed", () => {
      const parser = new ArgumentParser(["typescript", "-D", "--days", "14", "--allow-npm-install"]);
      const packages = parser.parsePackageArgs();

      expect(packages).toStrictEqual(["typescript"]);
    });
  });

  describe("hasSaveDevFlag()", () => {
    it("returns true when -D flag is present", () => {
      const parser = new ArgumentParser(["vue", "-D"]);

      expect(parser.hasSaveDevFlag()).toBeTruthy();
    });

    it("returns true when --save-dev flag is present", () => {
      const parser = new ArgumentParser(["vue", "--save-dev"]);

      expect(parser.hasSaveDevFlag()).toBeTruthy();
    });

    it("returns false when neither flag is present", () => {
      const parser = new ArgumentParser(["vue", "--days", "7"]);

      expect(parser.hasSaveDevFlag()).toBeFalsy();
    });

    it("returns false when no arguments", () => {
      const parser = new ArgumentParser([]);

      expect(parser.hasSaveDevFlag()).toBeFalsy();
    });

    it("returns true when both -D and --save-dev present", () => {
      const parser = new ArgumentParser(["vue", "-D", "--save-dev"]);

      expect(parser.hasSaveDevFlag()).toBeTruthy();
    });
  });

  describe("validateFlagCombinations()", () => {
    it("throws IncompatibleFlagsError when --dry-run used with --lint", () => {
      const parser = new ArgumentParser(["--dry-run", "--lint", "eslint"]);

      expect(() => parser.parse()).toThrow(IncompatibleFlagsError);
      expect(() => parser.parse()).toThrow(
        "--dry-run cannot be used with: --lint"
      );
    });

    it("throws IncompatibleFlagsError when --dry-run used with --typecheck", () => {
      const parser = new ArgumentParser(["--dry-run", "--typecheck", "tsc"]);

      expect(() => parser.parse()).toThrow(IncompatibleFlagsError);
    });

    it("throws IncompatibleFlagsError when --dry-run used with --test", () => {
      const parser = new ArgumentParser(["--dry-run", "--test", "vitest"]);

      expect(() => parser.parse()).toThrow(IncompatibleFlagsError);
    });

    it("throws IncompatibleFlagsError when --dry-run used with --build", () => {
      const parser = new ArgumentParser(["--dry-run", "--build", "build:prod"]);

      expect(() => parser.parse()).toThrow(IncompatibleFlagsError);
    });

    it("throws IncompatibleFlagsError when --dry-run used with multiple quality flags", () => {
      const parser = new ArgumentParser([
        "--dry-run",
        "--lint", "eslint",
        "--test", "vitest",
        "--build", "build:prod"
      ]);

      expect(() => parser.parse()).toThrow(IncompatibleFlagsError);
      expect(() => parser.parse()).toThrow(
        "--dry-run cannot be used with: --lint, --test, --build"
      );
    });

    it("allows --dry-run with --days", () => {
      const parser = new ArgumentParser(["--dry-run", "--days", "14"]);
      const options = parser.parse();

      expect(options.dryRun).toBeTruthy();
      expect(options.days).toBe(14);
    });

    it("allows --dry-run with --allow-npm-install", () => {
      const parser = new ArgumentParser(["--dry-run", "--allow-npm-install"]);
      const options = parser.parse();

      expect(options.dryRun).toBeTruthy();
      expect(options.allowNpmInstall).toBeTruthy();
    });

    it("allows quality flags without --dry-run", () => {
      const parser = new ArgumentParser([
        "--lint", "eslint",
        "--test", "vitest",
        "--build", "build:prod"
      ]);
      const options = parser.parse();

      expect(options.dryRun).toBeFalsy();
      expect(options.scripts.lint).toBe("eslint");
      expect(options.scripts.test).toBe("vitest");
      expect(options.scripts.build).toBe("build:prod");
    });
  });

  describe("command-specific flag validation", () => {
    it("throws InvalidFlagForCommandError when -D used with update command", () => {
      const parser = new ArgumentParser(["-D"], "update");

      expect(() => parser.parse()).toThrow(InvalidFlagForCommandError);
      expect(() => parser.parse()).toThrow(
        "-D can only be used with: add. Current command: update"
      );
    });

    it("throws InvalidFlagForCommandError when --save-dev used with update command", () => {
      const parser = new ArgumentParser(["--save-dev"], "update");

      expect(() => parser.parse()).toThrow(InvalidFlagForCommandError);
      expect(() => parser.parse()).toThrow(
        "--save-dev can only be used with: add. Current command: update"
      );
    });

    it("throws InvalidFlagForCommandError when -D used with install command", () => {
      const parser = new ArgumentParser(["-D"], "install");

      expect(() => parser.parse()).toThrow(InvalidFlagForCommandError);
      expect(() => parser.parse()).toThrow(
        "-D can only be used with: add. Current command: install"
      );
    });

    it("throws InvalidFlagForCommandError when --save-dev used with install command", () => {
      const parser = new ArgumentParser(["--save-dev"], "install");

      expect(() => parser.parse()).toThrow(InvalidFlagForCommandError);
      expect(() => parser.parse()).toThrow(
        "--save-dev can only be used with: add. Current command: install"
      );
    });

    it("throws InvalidFlagForCommandError when --dry-run used with install command", () => {
      const parser = new ArgumentParser(["--dry-run"], "install");

      expect(() => parser.parse()).toThrow(InvalidFlagForCommandError);
      expect(() => parser.parse()).toThrow(
        "--dry-run can only be used with: update. Current command: install"
      );
    });

    it("throws InvalidFlagForCommandError when --dry-run used with add command", () => {
      const parser = new ArgumentParser(["--dry-run"], "add");

      expect(() => parser.parse()).toThrow(InvalidFlagForCommandError);
      expect(() => parser.parse()).toThrow(
        "--dry-run can only be used with: update. Current command: add"
      );
    });

    it("allows --dry-run with update command", () => {
      const parser = new ArgumentParser(["--dry-run"], "update");
      const options = parser.parse();

      expect(options.dryRun).toBeTruthy();
    });

    it("allows -D with add command", () => {
      const parser = new ArgumentParser(["-D"], "add");
      const options = parser.parse();

      expect(options).toBeDefined();
    });

    it("allows --save-dev with add command", () => {
      const parser = new ArgumentParser(["--save-dev"], "add");
      const options = parser.parse();

      expect(options).toBeDefined();
    });

    it("allows -D when no subcommand is specified", () => {
      const parser = new ArgumentParser(["-D"]);
      const options = parser.parse();

      expect(options).toBeDefined();
    });

    it("allows --save-dev when no subcommand is specified", () => {
      const parser = new ArgumentParser(["--save-dev"]);
      const options = parser.parse();

      expect(options).toBeDefined();
    });

    it("throws InvalidFlagForCommandError when -D used with update and other flags", () => {
      const parser = new ArgumentParser(["-D", "--days", "14"], "update");

      expect(() => parser.parse()).toThrow(InvalidFlagForCommandError);
    });
  });
});
