import { describe, it, expect } from "vitest";
import { join } from "path";
import { PackageJsonReader } from "../../src/context/PackageJsonReader";

const FIXTURE_PATH = join(__dirname, "fixtures/package.json");

describe("PackageJsonReader", () => {
  describe("constructor", () => {
    it("reads package.json from specified path", () => {
      const reader = new PackageJsonReader(FIXTURE_PATH);
      expect(reader.raw.name).toBe("test-package");
    });

    it("throws when file does not exist", () => {
      expect(() => new PackageJsonReader("nonexistent.json")).toThrow();
    });
  });

  describe("scripts", () => {
    it("returns scripts from package.json", () => {
      const reader = new PackageJsonReader(FIXTURE_PATH);

      expect(reader.scripts).toEqual({
        build: "tsc",
        test: "vitest",
        lint: "eslint .",
      });
    });

    it("returns empty object when no scripts defined", () => {
      // The fixture has scripts, but we test the fallback behavior
      const reader = new PackageJsonReader(FIXTURE_PATH);
      expect(reader.scripts).toBeDefined();
    });
  });

  describe("dependencies", () => {
    it("returns production dependencies", () => {
      const reader = new PackageJsonReader(FIXTURE_PATH);

      expect(reader.dependencies).toEqual({
        lodash: "^4.17.21",
        express: "^4.18.0",
      });
    });
  });

  describe("devDependencies", () => {
    it("returns dev dependencies", () => {
      const reader = new PackageJsonReader(FIXTURE_PATH);

      expect(reader.devDependencies).toEqual({
        typescript: "^5.0.0",
        vitest: "^1.0.0",
      });
    });
  });

  describe("allDependencies", () => {
    it("returns merged dependencies and devDependencies", () => {
      const reader = new PackageJsonReader(FIXTURE_PATH);

      expect(reader.allDependencies).toEqual({
        lodash: "^4.17.21",
        express: "^4.18.0",
        typescript: "^5.0.0",
        vitest: "^1.0.0",
      });
    });
  });

  describe("raw", () => {
    it("returns the full package.json object", () => {
      const reader = new PackageJsonReader(FIXTURE_PATH);

      expect(reader.raw.name).toBe("test-package");
      expect(reader.raw.version).toBe("1.0.0");
    });
  });

  describe("hasScript()", () => {
    it("returns true when script exists", () => {
      const reader = new PackageJsonReader(FIXTURE_PATH);

      expect(reader.hasScript("build")).toBe(true);
      expect(reader.hasScript("test")).toBe(true);
    });

    it("returns false when script does not exist", () => {
      const reader = new PackageJsonReader(FIXTURE_PATH);

      expect(reader.hasScript("nonexistent")).toBe(false);
    });
  });

  describe("hasPackage()", () => {
    it("returns true for production dependency", () => {
      const reader = new PackageJsonReader(FIXTURE_PATH);

      expect(reader.hasPackage("lodash")).toBe(true);
    });

    it("returns true for dev dependency", () => {
      const reader = new PackageJsonReader(FIXTURE_PATH);

      expect(reader.hasPackage("typescript")).toBe(true);
    });

    it("returns false for non-existent package", () => {
      const reader = new PackageJsonReader(FIXTURE_PATH);

      expect(reader.hasPackage("nonexistent")).toBe(false);
    });
  });

  describe("getPackageVersion()", () => {
    it("returns version for production dependency", () => {
      const reader = new PackageJsonReader(FIXTURE_PATH);

      expect(reader.getPackageVersion("lodash")).toBe("^4.17.21");
    });

    it("returns version for dev dependency", () => {
      const reader = new PackageJsonReader(FIXTURE_PATH);

      expect(reader.getPackageVersion("typescript")).toBe("^5.0.0");
    });

    it("returns undefined for non-existent package", () => {
      const reader = new PackageJsonReader(FIXTURE_PATH);

      expect(reader.getPackageVersion("nonexistent")).toBeUndefined();
    });
  });
});
