import { describe, it, expect } from "vitest";
import { SubcommandParser, SubcommandParseError } from "../SubcommandParser";

describe("SubcommandParser", () => {
  describe("parse()", () => {
    describe("valid subcommands", () => {
      it('parses "install" subcommand', () => {
        const result = SubcommandParser.parse(["install"]);

        expect(result.subcommand).toBe("install");
        expect(result.args).toEqual([]);
      });

      it('parses "update" subcommand', () => {
        const result = SubcommandParser.parse(["update"]);

        expect(result.subcommand).toBe("update");
        expect(result.args).toEqual([]);
      });

      it("returns remaining args after install subcommand", () => {
        const result = SubcommandParser.parse(["install", "--allow-npm-install"]);

        expect(result.subcommand).toBe("install");
        expect(result.args).toEqual(["--allow-npm-install"]);
      });

      it("returns remaining args after update subcommand", () => {
        const result = SubcommandParser.parse(["update", "--days", "14"]);

        expect(result.subcommand).toBe("update");
        expect(result.args).toEqual(["--days", "14"]);
      });

      it("handles multiple flags after subcommand", () => {
        const result = SubcommandParser.parse([
          "update",
          "--days",
          "14",
          "--lint",
          "eslint",
          "--allow-npm-install",
        ]);

        expect(result.subcommand).toBe("update");
        expect(result.args).toEqual(["--days", "14", "--lint", "eslint", "--allow-npm-install"]);
      });
    });

    describe("error cases", () => {
      it("throws SubcommandParseError when no args provided", () => {
        expect(() => SubcommandParser.parse([])).toThrow(SubcommandParseError);
        expect(() => SubcommandParser.parse([])).toThrow("Please specify a subcommand");
      });

      it("throws SubcommandParseError when first arg is a flag", () => {
        expect(() => SubcommandParser.parse(["--days", "7"])).toThrow(SubcommandParseError);
        expect(() => SubcommandParser.parse(["--days", "7"])).toThrow("Please specify a subcommand");
      });

      it("throws SubcommandParseError for unknown subcommand", () => {
        expect(() => SubcommandParser.parse(["foo"])).toThrow(SubcommandParseError);
        expect(() => SubcommandParser.parse(["foo"])).toThrow("Unknown subcommand: foo");
      });

      it("includes helpful usage info in error message for no subcommand", () => {
        try {
          SubcommandParser.parse([]);
        } catch (error) {
          expect(error).toBeInstanceOf(SubcommandParseError);
          expect((error as Error).message).toContain("dep-guard install");
          expect((error as Error).message).toContain("dep-guard update");
        }
      });

      it("includes valid subcommands in error message for unknown subcommand", () => {
        try {
          SubcommandParser.parse(["invalid"]);
        } catch (error) {
          expect(error).toBeInstanceOf(SubcommandParseError);
          expect((error as Error).message).toContain("install");
          expect((error as Error).message).toContain("update");
        }
      });
    });
  });
});
