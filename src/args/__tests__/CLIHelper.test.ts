import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "fs";
import { CLIHelper } from "../CLIHelper";

// Mock fs module
vi.mock("fs", () => ({
  readFileSync: vi.fn(),
}));

describe("CLIHelper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getVersion()", () => {
    it("returns version from package.json", () => {
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ version: "1.2.3" }));

      const version = CLIHelper.getVersion();

      expect(version).toBe("1.2.3");
      expect(readFileSync).toHaveBeenCalledTimes(1);
    });

    it("reads from correct relative path", () => {
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ version: "0.1.0" }));

      CLIHelper.getVersion();

      const callArgs = vi.mocked(readFileSync).mock.calls[0];
      expect(callArgs[0]).toContain("package.json");
      expect(callArgs[1]).toBe("utf-8");
    });
  });

  describe("showHelp()", () => {
    it("outputs help message to console", () => {
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ version: "1.0.0" }));
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      CLIHelper.showHelp();

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain("dep-guard");
      expect(output).toContain("Usage:");
      expect(output).toContain("Options:");
      expect(output).toContain("--days");
      expect(output).toContain("--lint");
      expect(output).toContain("--help");
    });

    it("includes version in help output", () => {
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ version: "2.5.0" }));
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      CLIHelper.showHelp();

      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain("v2.5.0");
    });

    it("includes default values in help output", () => {
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ version: "1.0.0" }));
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      CLIHelper.showHelp();

      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain("default:");
    });

    it("includes examples section", () => {
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ version: "1.0.0" }));
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      CLIHelper.showHelp();

      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain("Examples:");
    });
  });
});
