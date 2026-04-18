import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("fs", () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

import { existsSync, readFileSync } from "fs";
import { AllowlistReader } from "../AllowlistReader";

describe("AllowlistReader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor - file loading", () => {
    it("loads an empty allowlist when file does not exist", () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const reader = new AllowlistReader();

      expect(reader.getPatternsFor("lodash")).toStrictEqual([]);
    });

    it("loads allowlist from file when it exists", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({ lodash: ["No provenance"] })
      );

      const reader = new AllowlistReader();

      expect(reader.getPatternsFor("lodash")).toStrictEqual(["No provenance"]);
    });

    it("returns empty allowlist on JSON parse error", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue("not valid json{{{");
      const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

      const reader = new AllowlistReader();

      expect(reader.getPatternsFor("lodash")).toStrictEqual([]);
      expect(stderrSpy).toHaveBeenCalledOnce();
      expect(stderrSpy.mock.calls[0][0]).toContain("dep-guard: warning:");
      stderrSpy.mockRestore();
    });

    it("returns empty array for package not in allowlist", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ lodash: ["Pattern"] }));

      const reader = new AllowlistReader();

      expect(reader.getPatternsFor("express")).toStrictEqual([]);
    });
  });

  describe("check() - exact matching", () => {
    beforeEach(() => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          lodash: ["Package has not been signed with provenance"],
          "some-pkg": ["Package lacks a security policy", "No maintainer"],
        })
      );
    });

    it("marks message as allowlisted when it matches exactly", () => {
      const reader = new AllowlistReader();

      const result = reader.check("lodash", ["Package has not been signed with provenance"]);

      expect(result.allowlisted).toStrictEqual(["Package has not been signed with provenance"]);
      expect(result.unmatched).toStrictEqual([]);
      expect(result.allAllowlisted).toBe(true);
    });

    it("marks message as unmatched when it does not match any pattern", () => {
      const reader = new AllowlistReader();

      const result = reader.check("lodash", ["New unknown warning"]);

      expect(result.allowlisted).toStrictEqual([]);
      expect(result.unmatched).toStrictEqual(["New unknown warning"]);
      expect(result.allAllowlisted).toBe(false);
    });

    it("handles mixed allowlisted and unmatched messages", () => {
      const reader = new AllowlistReader();

      const result = reader.check("some-pkg", [
        "Package lacks a security policy",
        "Brand new warning",
      ]);

      expect(result.allowlisted).toStrictEqual(["Package lacks a security policy"]);
      expect(result.unmatched).toStrictEqual(["Brand new warning"]);
      expect(result.allAllowlisted).toBe(false);
    });

    it("returns all allowlisted when all messages match", () => {
      const reader = new AllowlistReader();

      const result = reader.check("some-pkg", [
        "Package lacks a security policy",
        "No maintainer",
      ]);

      expect(result.allAllowlisted).toBe(true);
      expect(result.unmatched).toStrictEqual([]);
    });
  });

  describe("check() - glob pattern matching", () => {
    beforeEach(() => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          "some-pkg": [
            "Package published * days ago",
            "Contains * vulnerability",
          ],
        })
      );
    });

    it("matches messages with wildcard for variable text", () => {
      const reader = new AllowlistReader();

      const result = reader.check("some-pkg", ["Package published 3 days ago"]);

      expect(result.allowlisted).toStrictEqual(["Package published 3 days ago"]);
      expect(result.allAllowlisted).toBe(true);
    });

    it("matches different values for the same wildcard pattern", () => {
      const reader = new AllowlistReader();

      const result1 = reader.check("some-pkg", ["Package published 3 days ago"]);
      const result2 = reader.check("some-pkg", ["Package published 14 days ago"]);
      const result3 = reader.check("some-pkg", ["Package published 100 days ago"]);

      expect(result1.allAllowlisted).toBe(true);
      expect(result2.allAllowlisted).toBe(true);
      expect(result3.allAllowlisted).toBe(true);
    });

    it("does not match when message structure differs from pattern", () => {
      const reader = new AllowlistReader();

      // Pattern: "Package published * days ago" → regex: ^Package published .* days ago$
      // Message: "Package published days ago" (no space before "days" after the wildcard position)
      // The regex requires a space before "days", so this does NOT match.
      const result = reader.check("some-pkg", ["Package published days ago"]);

      expect(result.allAllowlisted).toBe(false);
      expect(result.unmatched).toStrictEqual(["Package published days ago"]);
    });

    it("matches wildcard at start of pattern", () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({ pkg: ["* security issue found"] })
      );
      const reader = new AllowlistReader();

      const result = reader.check("pkg", ["Critical security issue found"]);

      expect(result.allAllowlisted).toBe(true);
    });

    it("matches when wildcard could match multiple words", () => {
      const reader = new AllowlistReader();

      const result = reader.check("some-pkg", ["Contains critical remote code execution vulnerability"]);

      expect(result.allAllowlisted).toBe(true);
    });
  });

  describe("check() - case insensitive matching", () => {
    beforeEach(() => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({ pkg: ["Package lacks a security policy"] })
      );
    });

    it("matches regardless of case", () => {
      const reader = new AllowlistReader();

      const result = reader.check("pkg", ["PACKAGE LACKS A SECURITY POLICY"]);

      expect(result.allAllowlisted).toBe(true);
    });
  });

  describe("check() - ANSI stripping", () => {
    beforeEach(() => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({ pkg: ["Package lacks provenance"] })
      );
    });

    it("strips ANSI codes before matching", () => {
      const reader = new AllowlistReader();
      const ansiMessage = "\x1B[31mPackage lacks provenance\x1B[0m";

      const result = reader.check("pkg", [ansiMessage]);

      expect(result.allAllowlisted).toBe(true);
    });
  });

  describe("check() - empty inputs", () => {
    beforeEach(() => {
      vi.mocked(existsSync).mockReturnValue(false);
    });

    it("returns all-allowlisted for empty message list", () => {
      const reader = new AllowlistReader();

      const result = reader.check("lodash", []);

      expect(result.allowlisted).toStrictEqual([]);
      expect(result.unmatched).toStrictEqual([]);
      expect(result.allAllowlisted).toBe(true);
    });

    it("filters out empty/whitespace-only messages", () => {
      const reader = new AllowlistReader();

      const result = reader.check("lodash", ["", "   ", "\t"]);

      expect(result.allowlisted).toStrictEqual([]);
      expect(result.unmatched).toStrictEqual([]);
      expect(result.allAllowlisted).toBe(true);
    });
  });

  describe("check() - no allowlist file", () => {
    it("treats all messages as unmatched when no allowlist file exists", () => {
      vi.mocked(existsSync).mockReturnValue(false);
      const reader = new AllowlistReader();

      const result = reader.check("lodash", ["Some warning"]);

      expect(result.allowlisted).toStrictEqual([]);
      expect(result.unmatched).toStrictEqual(["Some warning"]);
      expect(result.allAllowlisted).toBe(false);
    });
  });
});
