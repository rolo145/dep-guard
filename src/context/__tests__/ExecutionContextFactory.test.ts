import { describe, it, expect } from "vitest";
import { join } from "path";
import { ExecutionContextFactory } from "../ExecutionContextFactory";
import type { ScriptOptions } from "../../args/types";

const FIXTURE_PATH = join(__dirname, "fixtures/package.json");

describe("ExecutionContextFactory", () => {
  describe("create()", () => {
    it("creates context with specified options", () => {
      const scripts: ScriptOptions = {
        lint: "lint",
        typecheck: "typecheck",
        test: "test",
        build: "build",
      };

      const context = ExecutionContextFactory.create({
        days: 14,
        scripts,
        packageJsonPath: FIXTURE_PATH,
      });

      expect(context.days).toBe(14);
      expect(context.scriptNames).toEqual(scripts);
    });

    it("creates context that reads package.json", () => {
      const scripts: ScriptOptions = {
        lint: "lint",
        typecheck: "typecheck",
        test: "test",
        build: "build",
      };

      const context = ExecutionContextFactory.create({
        days: 7,
        scripts,
        packageJsonPath: FIXTURE_PATH,
      });

      expect(context.raw.name).toBe("test-package");
    });
  });

  describe("createWithDefaults()", () => {
    it("creates context with default script names", () => {
      const context = ExecutionContextFactory.createWithDefaults(7, FIXTURE_PATH);

      expect(context.scriptNames).toEqual({
        lint: "lint",
        typecheck: "typecheck",
        test: "test",
        build: "build",
      });
    });

    it("uses specified days value", () => {
      const context = ExecutionContextFactory.createWithDefaults(21, FIXTURE_PATH);

      expect(context.days).toBe(21);
    });

    it("reads package.json from specified path", () => {
      const context = ExecutionContextFactory.createWithDefaults(7, FIXTURE_PATH);

      expect(context.raw.name).toBe("test-package");
    });
  });

  describe("createMock()", () => {
    it("creates mock context with default values", () => {
      const mock = ExecutionContextFactory.createMock();

      expect(mock.scripts).toEqual({});
      expect(mock.allDependencies).toEqual({});
      expect(mock.dependencies).toEqual({});
      expect(mock.devDependencies).toEqual({});
      expect(mock.days).toBe(7);
      expect(mock.hasScript("any")).toBeFalsy();
      expect(mock.hasPackage("any")).toBeFalsy();
      expect(mock.getPackageVersion("any")).toBeUndefined();
    });

    it("allows overriding specific properties", () => {
      const mock = ExecutionContextFactory.createMock({
        days: 14,
        scripts: { build: "npm run build" },
      });

      expect(mock.days).toBe(14);
      expect(mock.scripts).toEqual({ build: "npm run build" });
    });

    it("allows overriding methods", () => {
      const mock = ExecutionContextFactory.createMock({
        hasScript: (name: string) => name === "test",
        hasPackage: (name: string) => name === "lodash",
      });

      expect(mock.hasScript("test")).toBeTruthy();
      expect(mock.hasScript("build")).toBeFalsy();
      expect(mock.hasPackage("lodash")).toBeTruthy();
      expect(mock.hasPackage("express")).toBeFalsy();
    });

    it("includes cutoff date", () => {
      const mock = ExecutionContextFactory.createMock();

      expect(mock.cutoff).toBeInstanceOf(Date);
      expect(mock.cutoffIso).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("includes default scriptNames", () => {
      const mock = ExecutionContextFactory.createMock();

      expect(mock.scriptNames).toEqual({
        lint: "lint",
        typecheck: "typecheck",
        test: "test",
        build: "build",
      });
    });
  });
});
