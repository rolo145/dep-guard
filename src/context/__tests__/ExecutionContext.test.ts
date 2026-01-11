import { describe, it, expect, vi } from "vitest";
import { join } from "path";
import { ExecutionContext } from "../ExecutionContext";
import type { ScriptOptions } from "../../args/types";

const FIXTURE_PATH = join(__dirname, "fixtures/package.json");

const defaultScripts: ScriptOptions = {
  lint: "lint",
  typecheck: "typecheck",
  test: "test",
  build: "build",
};

describe("ExecutionContext", () => {
  describe("constructor", () => {
    it("creates context with specified options", () => {
      const context = new ExecutionContext({
        days: 14,
        scripts: defaultScripts,
        packageJsonPath: FIXTURE_PATH,
      });

      expect(context.days).toBe(14);
      expect(context.scriptNames).toEqual(defaultScripts);
    });

    it("calculates cutoff date based on days", () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const context = new ExecutionContext({
        days: 7,
        scripts: defaultScripts,
        packageJsonPath: FIXTURE_PATH,
      });

      const expectedCutoff = new Date(now - 7 * 24 * 60 * 60 * 1000);
      expect(context.cutoff.getTime()).toBe(expectedCutoff.getTime());

      vi.useRealTimers();
    });
  });

  describe("package.json accessors", () => {
    it("returns scripts from package.json", () => {
      const context = new ExecutionContext({
        days: 7,
        scripts: defaultScripts,
        packageJsonPath: FIXTURE_PATH,
      });

      expect(context.scripts).toEqual({
        build: "tsc",
        test: "vitest",
        lint: "eslint .",
      });
    });

    it("returns dependencies from package.json", () => {
      const context = new ExecutionContext({
        days: 7,
        scripts: defaultScripts,
        packageJsonPath: FIXTURE_PATH,
      });

      expect(context.dependencies).toEqual({
        lodash: "^4.17.21",
        express: "^4.18.0",
      });
    });

    it("returns devDependencies from package.json", () => {
      const context = new ExecutionContext({
        days: 7,
        scripts: defaultScripts,
        packageJsonPath: FIXTURE_PATH,
      });

      expect(context.devDependencies).toEqual({
        typescript: "^5.0.0",
        vitest: "^1.0.0",
      });
    });

    it("returns allDependencies merged", () => {
      const context = new ExecutionContext({
        days: 7,
        scripts: defaultScripts,
        packageJsonPath: FIXTURE_PATH,
      });

      expect(context.allDependencies).toEqual({
        lodash: "^4.17.21",
        express: "^4.18.0",
        typescript: "^5.0.0",
        vitest: "^1.0.0",
      });
    });

    it("returns raw package.json", () => {
      const context = new ExecutionContext({
        days: 7,
        scripts: defaultScripts,
        packageJsonPath: FIXTURE_PATH,
      });

      expect(context.raw.name).toBe("test-package");
      expect(context.raw.version).toBe("1.0.0");
    });
  });

  describe("workflow configuration", () => {
    it("returns cutoff date", () => {
      const context = new ExecutionContext({
        days: 7,
        scripts: defaultScripts,
        packageJsonPath: FIXTURE_PATH,
      });

      expect(context.cutoff).toBeInstanceOf(Date);
    });

    it("returns cutoff as ISO string", () => {
      const context = new ExecutionContext({
        days: 7,
        scripts: defaultScripts,
        packageJsonPath: FIXTURE_PATH,
      });

      expect(context.cutoffIso).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("returns days", () => {
      const context = new ExecutionContext({
        days: 14,
        scripts: defaultScripts,
        packageJsonPath: FIXTURE_PATH,
      });

      expect(context.days).toBe(14);
    });

    it("returns scriptNames", () => {
      const customScripts: ScriptOptions = {
        lint: "eslint",
        typecheck: "tsc",
        test: "jest",
        build: "webpack",
      };

      const context = new ExecutionContext({
        days: 7,
        scripts: customScripts,
        packageJsonPath: FIXTURE_PATH,
      });

      expect(context.scriptNames).toEqual(customScripts);
    });
  });

  describe("helper methods", () => {
    it("hasScript returns true for existing script", () => {
      const context = new ExecutionContext({
        days: 7,
        scripts: defaultScripts,
        packageJsonPath: FIXTURE_PATH,
      });

      expect(context.hasScript("build")).toBe(true);
    });

    it("hasScript returns false for non-existing script", () => {
      const context = new ExecutionContext({
        days: 7,
        scripts: defaultScripts,
        packageJsonPath: FIXTURE_PATH,
      });

      expect(context.hasScript("nonexistent")).toBe(false);
    });

    it("hasPackage returns true for existing package", () => {
      const context = new ExecutionContext({
        days: 7,
        scripts: defaultScripts,
        packageJsonPath: FIXTURE_PATH,
      });

      expect(context.hasPackage("lodash")).toBe(true);
      expect(context.hasPackage("typescript")).toBe(true);
    });

    it("hasPackage returns false for non-existing package", () => {
      const context = new ExecutionContext({
        days: 7,
        scripts: defaultScripts,
        packageJsonPath: FIXTURE_PATH,
      });

      expect(context.hasPackage("nonexistent")).toBe(false);
    });

    it("getPackageVersion returns version for existing package", () => {
      const context = new ExecutionContext({
        days: 7,
        scripts: defaultScripts,
        packageJsonPath: FIXTURE_PATH,
      });

      expect(context.getPackageVersion("lodash")).toBe("^4.17.21");
    });

    it("getPackageVersion returns undefined for non-existing package", () => {
      const context = new ExecutionContext({
        days: 7,
        scripts: defaultScripts,
        packageJsonPath: FIXTURE_PATH,
      });

      expect(context.getPackageVersion("nonexistent")).toBeUndefined();
    });
  });
});
