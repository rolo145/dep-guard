import { describe, it, expect, vi } from "vitest";

vi.mock("chalk", () => ({
  default: {
    green: (s: string) => `[green]${s}[/green]`,
    blue: (s: string) => `[blue]${s}[/blue]`,
    red: (s: string) => `[red]${s}[/red]`,
    dim: (s: string) => `[dim]${s}[/dim]`,
    bold: (s: string) => `[bold]${s}[/bold]`,
  },
}));

vi.mock("../VersionFormatter", () => ({
  VersionFormatter: {
    formatWithHighlight: vi.fn((current, next, type) => `${current} → ${next}`),
  },
}));

import { PromptChoiceBuilder } from "../PromptChoiceBuilder";
import type { GroupedUpdates } from "../types";

describe("PromptChoiceBuilder", () => {
  const createGrouped = (overrides: Partial<GroupedUpdates> = {}): GroupedUpdates => ({
    major: [],
    minor: [],
    patch: [],
    ...overrides,
  });

  describe("build()", () => {
    it("returns empty array for empty groups", () => {
      const grouped = createGrouped();
      const builder = new PromptChoiceBuilder(grouped, 10);

      const result = builder.build();

      expect(result).toEqual([]);
    });
  });

  describe("addPatchGroup()", () => {
    it("adds patch group header and packages", () => {
      const grouped = createGrouped({
        patch: [{ name: "lodash", currentVersion: "4.17.0", newVersion: "4.17.1" }],
      });
      const builder = new PromptChoiceBuilder(grouped, 10);

      const result = builder.addPatchGroup().build();

      expect(result).toHaveLength(2);
      expect(result[0].disabled).toBe(" ");
      expect(result[0].name).toContain("[green]Patch (1)[/green]");
      expect(result[1].value).toEqual({ name: "lodash", version: "4.17.1" });
    });

    it("skips empty patch group", () => {
      const grouped = createGrouped();
      const builder = new PromptChoiceBuilder(grouped, 10);

      const result = builder.addPatchGroup().build();

      expect(result).toEqual([]);
    });

    it("includes npm link in package name", () => {
      const grouped = createGrouped({
        patch: [{ name: "lodash", currentVersion: "4.17.0", newVersion: "4.17.1" }],
      });
      const builder = new PromptChoiceBuilder(grouped, 10);

      const result = builder.addPatchGroup().build();

      expect(result[1].name).toContain("npmjs.com/package/lodash");
    });
  });

  describe("addMinorGroup()", () => {
    it("adds minor group header and packages", () => {
      const grouped = createGrouped({
        minor: [{ name: "express", currentVersion: "4.18.0", newVersion: "4.19.0" }],
      });
      const builder = new PromptChoiceBuilder(grouped, 10);

      const result = builder.addMinorGroup().build();

      expect(result).toHaveLength(2);
      expect(result[0].name).toContain("[blue]Minor (1)[/blue]");
      expect(result[1].value).toEqual({ name: "express", version: "4.19.0" });
    });

    it("skips empty minor group", () => {
      const grouped = createGrouped();
      const builder = new PromptChoiceBuilder(grouped, 10);

      const result = builder.addMinorGroup().build();

      expect(result).toEqual([]);
    });
  });

  describe("addMajorGroup()", () => {
    it("adds major group header and packages", () => {
      const grouped = createGrouped({
        major: [{ name: "chalk", currentVersion: "4.0.0", newVersion: "5.0.0" }],
      });
      const builder = new PromptChoiceBuilder(grouped, 10);

      const result = builder.addMajorGroup().build();

      expect(result).toHaveLength(2);
      expect(result[0].name).toContain("[red]Major (1)[/red]");
      expect(result[1].value).toEqual({ name: "chalk", version: "5.0.0" });
    });

    it("skips empty major group", () => {
      const grouped = createGrouped();
      const builder = new PromptChoiceBuilder(grouped, 10);

      const result = builder.addMajorGroup().build();

      expect(result).toEqual([]);
    });
  });

  describe("chaining", () => {
    it("supports method chaining", () => {
      const grouped = createGrouped({
        patch: [{ name: "a", currentVersion: "1.0.0", newVersion: "1.0.1" }],
        minor: [{ name: "b", currentVersion: "1.0.0", newVersion: "1.1.0" }],
        major: [{ name: "c", currentVersion: "1.0.0", newVersion: "2.0.0" }],
      });
      const builder = new PromptChoiceBuilder(grouped, 5);

      const result = builder.addPatchGroup().addMinorGroup().addMajorGroup().build();

      expect(result).toHaveLength(6);
    });

    it("maintains order of groups", () => {
      const grouped = createGrouped({
        patch: [{ name: "a", currentVersion: "1.0.0", newVersion: "1.0.1" }],
        minor: [{ name: "b", currentVersion: "1.0.0", newVersion: "1.1.0" }],
        major: [{ name: "c", currentVersion: "1.0.0", newVersion: "2.0.0" }],
      });
      const builder = new PromptChoiceBuilder(grouped, 5);

      const result = builder.addPatchGroup().addMinorGroup().addMajorGroup().build();

      expect(result[0].name).toContain("Patch");
      expect(result[2].name).toContain("Minor");
      expect(result[4].name).toContain("Major");
    });
  });

  describe("padding", () => {
    it("pads package names for alignment", () => {
      const grouped = createGrouped({
        patch: [
          { name: "a", currentVersion: "1.0.0", newVersion: "1.0.1" },
          { name: "longer-name", currentVersion: "1.0.0", newVersion: "1.0.1" },
        ],
      });
      const builder = new PromptChoiceBuilder(grouped, 11);

      const result = builder.addPatchGroup().build();

      const shortName = result[1].name;
      const longName = result[2].name;

      expect(shortName.indexOf("→")).toBe(longName.indexOf("→"));
    });
  });

  describe("header format", () => {
    it("includes count in header", () => {
      const grouped = createGrouped({
        patch: [
          { name: "a", currentVersion: "1.0.0", newVersion: "1.0.1" },
          { name: "b", currentVersion: "1.0.0", newVersion: "1.0.1" },
          { name: "c", currentVersion: "1.0.0", newVersion: "1.0.1" },
        ],
      });
      const builder = new PromptChoiceBuilder(grouped, 5);

      const result = builder.addPatchGroup().build();

      expect(result[0].name).toContain("(3)");
    });

    it("includes description in header", () => {
      const grouped = createGrouped({
        patch: [{ name: "a", currentVersion: "1.0.0", newVersion: "1.0.1" }],
      });
      const builder = new PromptChoiceBuilder(grouped, 5);

      const result = builder.addPatchGroup().build();

      expect(result[0].name).toContain("bug fixes");
    });

    it("header is disabled with space", () => {
      const grouped = createGrouped({
        patch: [{ name: "a", currentVersion: "1.0.0", newVersion: "1.0.1" }],
      });
      const builder = new PromptChoiceBuilder(grouped, 5);

      const result = builder.addPatchGroup().build();

      expect(result[0].disabled).toBe(" ");
    });
  });

  describe("package choices", () => {
    it("sets checked to false by default", () => {
      const grouped = createGrouped({
        patch: [{ name: "a", currentVersion: "1.0.0", newVersion: "1.0.1" }],
      });
      const builder = new PromptChoiceBuilder(grouped, 5);

      const result = builder.addPatchGroup().build();

      expect(result[1].checked).toBeFalsy();
    });

    it("includes package name and version in value", () => {
      const grouped = createGrouped({
        patch: [{ name: "lodash", currentVersion: "4.17.0", newVersion: "4.17.21" }],
      });
      const builder = new PromptChoiceBuilder(grouped, 10);

      const result = builder.addPatchGroup().build();

      expect(result[1].value).toEqual({
        name: "lodash",
        version: "4.17.21",
      });
    });
  });
});
