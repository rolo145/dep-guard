import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../utils/command", () => ({
  runWithOutput: vi.fn(),
}));

import { NPQRunner } from "../NPQRunner";
import { runWithOutput } from "../../utils/command";

describe("NPQRunner", () => {
  let runner: NPQRunner;

  beforeEach(() => {
    vi.clearAllMocks();
    runner = new NPQRunner();
  });

  describe("checkCapturingOutput()", () => {
    it("calls runWithOutput with correct arguments", () => {
      vi.mocked(runWithOutput).mockReturnValue({ success: true, output: "" });

      runner.checkCapturingOutput("lodash@4.17.21");

      expect(runWithOutput).toHaveBeenCalledWith("npq", [
        "install",
        "lodash@4.17.21",
        "--dry-run",
      ]);
    });

    it("returns passed: true when output has no issue lines", () => {
      // NPQ always exits 0 in --dry-run; passed is determined by output content
      vi.mocked(runWithOutput).mockReturnValue({ success: true, output: "\nSummary:\n\n - Total packages: 1\n - Total errors: 0\n" });

      const result = runner.checkCapturingOutput("lodash@4.17.21");

      expect(result.passed).toBe(true);
      expect(result.packageSpec).toBe("lodash@4.17.21");
    });

    it("returns passed: false when output contains ERROR lines", () => {
      vi.mocked(runWithOutput).mockReturnValue({
        success: true, // NPQ exits 0 even with errors in dry-run
        output: "  ERROR: Supply Chain Security - Malware detected",
      });

      const result = runner.checkCapturingOutput("bad-pkg@1.0.0");

      expect(result.passed).toBe(false);
    });

    it("returns passed: false when output contains only WARNING lines", () => {
      vi.mocked(runWithOutput).mockReturnValue({
        success: true,
        output: "  WARNING: Supply Chain Security - No provenance",
      });

      const result = runner.checkCapturingOutput("pkg@1.0.0");

      expect(result.passed).toBe(false);
    });

    it("extracts ERROR and WARNING lines, stripping severity prefix", () => {
      vi.mocked(runWithOutput).mockReturnValue({
        success: true,
        output: [
          "Packages with issues found:",
          "",
          "--- Package: pkg@1.0.0 ---",
          "  ERROR: Package Health - Expired domain detected",
          "  WARNING: Supply Chain Security - No provenance",
          "",
          "Summary:",
          " - Total errors: 1",
          " - Total warnings: 1",
        ].join("\n"),
      });

      const result = runner.checkCapturingOutput("pkg@1.0.0");

      expect(result.outputLines).toStrictEqual([
        "Package Health - Expired domain detected",
        "Supply Chain Security - No provenance",
      ]);
    });

    it("returns empty outputLines when there are no issue lines", () => {
      vi.mocked(runWithOutput).mockReturnValue({ success: true, output: "" });

      const result = runner.checkCapturingOutput("safe-pkg@1.0.0");

      expect(result.outputLines).toStrictEqual([]);
    });

    it("ignores header, package name, and summary lines", () => {
      vi.mocked(runWithOutput).mockReturnValue({
        success: true,
        output: "Packages with issues found:\n--- Package: pkg@1.0.0 ---\nSummary:\n - Total packages: 1",
      });

      const result = runner.checkCapturingOutput("pkg@1.0.0");

      expect(result.outputLines).toStrictEqual([]);
      expect(result.passed).toBe(true);
    });

    it("handles scoped packages", () => {
      vi.mocked(runWithOutput).mockReturnValue({ success: true, output: "" });

      runner.checkCapturingOutput("@vue/reactivity@3.0.0");

      expect(runWithOutput).toHaveBeenCalledWith("npq", [
        "install",
        "@vue/reactivity@3.0.0",
        "--dry-run",
      ]);
    });
  });
});
