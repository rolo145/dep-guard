import { describe, it, expect, vi } from "vitest";

vi.mock("chalk", () => ({
  default: {
    red: (s: string) => `[red]${s}[/red]`,
    blue: (s: string) => `[blue]${s}[/blue]`,
    green: (s: string) => `[green]${s}[/green]`,
  },
}));

import { VersionFormatter } from "../VersionFormatter";

describe("VersionFormatter", () => {
  describe("formatWithHighlight()", () => {
    it("highlights entire version in red for major bump", () => {
      const result = VersionFormatter.formatWithHighlight("1.0.0", "2.0.0", "major");

      expect(result).toBe("1.0.0 → [red]2.0.0[/red]");
    });

    it("highlights minor.patch in blue for minor bump", () => {
      const result = VersionFormatter.formatWithHighlight("1.0.0", "1.1.0", "minor");

      expect(result).toBe("1.0.0 → 1.[blue]1.0[/blue]");
    });

    it("highlights only patch in green for patch bump", () => {
      const result = VersionFormatter.formatWithHighlight("1.0.0", "1.0.1", "patch");

      expect(result).toBe("1.0.0 → 1.0.[green]1[/green]");
    });

    it("strips caret prefix from versions", () => {
      const result = VersionFormatter.formatWithHighlight("^1.0.0", "^2.0.0", "major");

      expect(result).toBe("1.0.0 → [red]2.0.0[/red]");
    });

    it("strips tilde prefix from versions", () => {
      const result = VersionFormatter.formatWithHighlight("~1.0.0", "~1.0.1", "patch");

      expect(result).toBe("1.0.0 → 1.0.[green]1[/green]");
    });

    it("returns plain format for invalid current version", () => {
      const result = VersionFormatter.formatWithHighlight("invalid", "2.0.0", "major");

      expect(result).toBe("invalid → 2.0.0");
    });

    it("returns plain format for invalid next version", () => {
      const result = VersionFormatter.formatWithHighlight("1.0.0", "invalid", "major");

      expect(result).toBe("1.0.0 → invalid");
    });

    it("returns plain format for prerelease versions", () => {
      const result = VersionFormatter.formatWithHighlight("1.0.0", "2.0.0-beta.1", "major");

      expect(result).toBe("1.0.0 → 2.0.0-beta.1");
    });
  });
});
