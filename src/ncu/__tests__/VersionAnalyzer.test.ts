import { describe, it, expect } from "vitest";
import { VersionAnalyzer } from "../VersionAnalyzer";

describe("VersionAnalyzer", () => {
  describe("cleanVersion()", () => {
    it("removes caret prefix", () => {
      expect(VersionAnalyzer.cleanVersion("^1.2.3")).toBe("1.2.3");
    });

    it("removes tilde prefix", () => {
      expect(VersionAnalyzer.cleanVersion("~1.2.3")).toBe("1.2.3");
    });

    it("returns version unchanged if no prefix", () => {
      expect(VersionAnalyzer.cleanVersion("1.2.3")).toBe("1.2.3");
    });

    it("handles version with only major number", () => {
      expect(VersionAnalyzer.cleanVersion("^1")).toBe("1");
    });
  });

  describe("isStable()", () => {
    it("returns true for stable version", () => {
      expect(VersionAnalyzer.isStable("1.2.3")).toBeTruthy();
    });

    it("returns true for version with zeros", () => {
      expect(VersionAnalyzer.isStable("0.0.0")).toBeTruthy();
    });

    it("returns false for alpha version", () => {
      expect(VersionAnalyzer.isStable("1.0.0-alpha.1")).toBeFalsy();
    });

    it("returns false for beta version", () => {
      expect(VersionAnalyzer.isStable("2.0.0-beta.3")).toBeFalsy();
    });

    it("returns false for rc version", () => {
      expect(VersionAnalyzer.isStable("3.0.0-rc.1")).toBeFalsy();
    });

    it("returns false for next version", () => {
      expect(VersionAnalyzer.isStable("1.0.0-next.5")).toBeFalsy();
    });

    it("returns false for incomplete version", () => {
      expect(VersionAnalyzer.isStable("1.2")).toBeFalsy();
    });
  });

  describe("parseSemver()", () => {
    it("parses standard semver", () => {
      expect(VersionAnalyzer.parseSemver("1.2.3")).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
      });
    });

    it("parses version with caret prefix", () => {
      expect(VersionAnalyzer.parseSemver("^4.5.6")).toEqual({
        major: 4,
        minor: 5,
        patch: 6,
      });
    });

    it("parses version with tilde prefix", () => {
      expect(VersionAnalyzer.parseSemver("~7.8.9")).toEqual({
        major: 7,
        minor: 8,
        patch: 9,
      });
    });

    it("parses version with zeros", () => {
      expect(VersionAnalyzer.parseSemver("0.0.1")).toEqual({
        major: 0,
        minor: 0,
        patch: 1,
      });
    });

    it("returns null for incomplete version", () => {
      expect(VersionAnalyzer.parseSemver("1.2")).toBeNull();
    });

    it("returns null for prerelease version", () => {
      expect(VersionAnalyzer.parseSemver("1.2.3-beta.1")).toBeNull();
    });

    it("returns null for invalid format", () => {
      expect(VersionAnalyzer.parseSemver("not-a-version")).toBeNull();
    });
  });

  describe("getBumpType()", () => {
    it("detects major bump", () => {
      expect(VersionAnalyzer.getBumpType("1.0.0", "2.0.0")).toBe("major");
    });

    it("detects major bump with prefix", () => {
      expect(VersionAnalyzer.getBumpType("^1.5.3", "^2.0.0")).toBe("major");
    });

    it("detects minor bump", () => {
      expect(VersionAnalyzer.getBumpType("1.0.0", "1.1.0")).toBe("minor");
    });

    it("detects minor bump with prefix", () => {
      expect(VersionAnalyzer.getBumpType("~1.0.0", "~1.2.0")).toBe("minor");
    });

    it("detects patch bump", () => {
      expect(VersionAnalyzer.getBumpType("1.0.0", "1.0.1")).toBe("patch");
    });

    it("detects patch bump with prefix", () => {
      expect(VersionAnalyzer.getBumpType("^1.0.0", "^1.0.5")).toBe("patch");
    });

    it("returns patch for same version", () => {
      expect(VersionAnalyzer.getBumpType("1.0.0", "1.0.0")).toBe("patch");
    });

    it("returns patch for empty current version", () => {
      expect(VersionAnalyzer.getBumpType("", "1.0.0")).toBe("patch");
    });

    it("returns patch for empty next version", () => {
      expect(VersionAnalyzer.getBumpType("1.0.0", "")).toBe("patch");
    });

    it("returns patch for invalid versions", () => {
      expect(VersionAnalyzer.getBumpType("invalid", "also-invalid")).toBe("patch");
    });
  });

  describe("groupByType()", () => {
    it("groups updates by bump type", () => {
      const updates = {
        lodash: "5.0.0",
        express: "4.19.0",
        chalk: "5.0.1",
      };
      const deps = {
        lodash: "^4.17.0",
        express: "^4.18.0",
        chalk: "^5.0.0",
      };

      const result = VersionAnalyzer.groupByType(updates, deps);

      expect(result.major).toHaveLength(1);
      expect(result.major[0].name).toBe("lodash");
      expect(result.minor).toHaveLength(1);
      expect(result.minor[0].name).toBe("express");
      expect(result.patch).toHaveLength(1);
      expect(result.patch[0].name).toBe("chalk");
    });

    it("returns empty arrays when no updates", () => {
      const result = VersionAnalyzer.groupByType({}, {});

      expect(result.major).toEqual([]);
      expect(result.minor).toEqual([]);
      expect(result.patch).toEqual([]);
    });

    it("includes currentVersion and newVersion in result", () => {
      const updates = { lodash: "5.0.0" };
      const deps = { lodash: "^4.17.0" };

      const result = VersionAnalyzer.groupByType(updates, deps);

      expect(result.major[0]).toEqual({
        name: "lodash",
        currentVersion: "^4.17.0",
        newVersion: "5.0.0",
      });
    });
  });

  describe("getMaxPackageNameLength()", () => {
    it("returns max length from all groups", () => {
      const grouped = {
        major: [{ name: "lodash", currentVersion: "4.0.0", newVersion: "5.0.0" }],
        minor: [{ name: "express-validator", currentVersion: "1.0.0", newVersion: "1.1.0" }],
        patch: [{ name: "chalk", currentVersion: "5.0.0", newVersion: "5.0.1" }],
      };

      expect(VersionAnalyzer.getMaxPackageNameLength(grouped)).toBe(17); // "express-validator"
    });

    it("returns 0 for empty groups", () => {
      const grouped = { major: [], minor: [], patch: [] };

      expect(VersionAnalyzer.getMaxPackageNameLength(grouped)).toBe(0);
    });

    it("handles single package", () => {
      const grouped = {
        major: [],
        minor: [],
        patch: [{ name: "chalk", currentVersion: "5.0.0", newVersion: "5.0.1" }],
      };

      expect(VersionAnalyzer.getMaxPackageNameLength(grouped)).toBe(5);
    });
  });
});
