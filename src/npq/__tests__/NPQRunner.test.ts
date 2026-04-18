import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../utils/command", () => ({
  tryRunCommand: vi.fn(),
  runWithOutput: vi.fn(),
}));

import { NPQRunner } from "../NPQRunner";
import { tryRunCommand, runWithOutput } from "../../utils/command";

describe("NPQRunner", () => {
  let runner: NPQRunner;

  beforeEach(() => {
    vi.clearAllMocks();
    runner = new NPQRunner();
  });

  describe("check()", () => {
    it("calls tryRunCommand with correct arguments", () => {
      vi.mocked(tryRunCommand).mockReturnValue(true);

      runner.check("lodash@5.0.0");

      expect(tryRunCommand).toHaveBeenCalledWith("npq", [
        "install",
        "lodash@5.0.0",
        "--dry-run",
      ]);
    });

    it("returns passed: true when command succeeds", () => {
      vi.mocked(tryRunCommand).mockReturnValue(true);

      const result = runner.check("lodash@5.0.0");

      expect(result).toStrictEqual({
        packageSpec: "lodash@5.0.0",
        passed: true,
      });
    });

    it("returns passed: false when command fails", () => {
      vi.mocked(tryRunCommand).mockReturnValue(false);

      const result = runner.check("malicious-pkg@1.0.0");

      expect(result).toStrictEqual({
        packageSpec: "malicious-pkg@1.0.0",
        passed: false,
      });
    });

    it("handles scoped packages", () => {
      vi.mocked(tryRunCommand).mockReturnValue(true);

      const result = runner.check("@vue/reactivity@3.0.0");

      expect(tryRunCommand).toHaveBeenCalledWith("npq", [
        "install",
        "@vue/reactivity@3.0.0",
        "--dry-run",
      ]);
      expect(result.packageSpec).toBe("@vue/reactivity@3.0.0");
    });
  });

  describe("checkBatch()", () => {
    it("checks multiple packages", () => {
      vi.mocked(tryRunCommand).mockReturnValue(true);

      const results = runner.checkBatch(["lodash@5.0.0", "express@4.19.0"]);

      expect(results).toHaveLength(2);
      expect(tryRunCommand).toHaveBeenCalledTimes(2);
    });

    it("returns results for each package", () => {
      vi.mocked(tryRunCommand)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      const results = runner.checkBatch(["safe-pkg@1.0.0", "unsafe-pkg@1.0.0"]);

      expect(results[0]).toStrictEqual({
        packageSpec: "safe-pkg@1.0.0",
        passed: true,
      });
      expect(results[1]).toStrictEqual({
        packageSpec: "unsafe-pkg@1.0.0",
        passed: false,
      });
    });

    it("returns empty array for empty input", () => {
      const results = runner.checkBatch([]);

      expect(results).toStrictEqual([]);
      expect(tryRunCommand).not.toHaveBeenCalled();
    });

    it("maintains order of packages", () => {
      vi.mocked(tryRunCommand).mockReturnValue(true);

      const specs = ["a@1.0.0", "b@2.0.0", "c@3.0.0"];
      const results = runner.checkBatch(specs);

      expect(results.map((r) => r.packageSpec)).toStrictEqual(specs);
    });
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
