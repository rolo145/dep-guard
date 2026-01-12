import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../utils/command", () => ({
  tryRunCommand: vi.fn(),
}));

import { NPQRunner } from "../NPQRunner";
import { tryRunCommand } from "../../utils/command";

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

      expect(result).toEqual({
        packageSpec: "lodash@5.0.0",
        passed: true,
      });
    });

    it("returns passed: false when command fails", () => {
      vi.mocked(tryRunCommand).mockReturnValue(false);

      const result = runner.check("malicious-pkg@1.0.0");

      expect(result).toEqual({
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

      expect(results[0]).toEqual({
        packageSpec: "safe-pkg@1.0.0",
        passed: true,
      });
      expect(results[1]).toEqual({
        packageSpec: "unsafe-pkg@1.0.0",
        passed: false,
      });
    });

    it("returns empty array for empty input", () => {
      const results = runner.checkBatch([]);

      expect(results).toEqual([]);
      expect(tryRunCommand).not.toHaveBeenCalled();
    });

    it("maintains order of packages", () => {
      vi.mocked(tryRunCommand).mockReturnValue(true);

      const specs = ["a@1.0.0", "b@2.0.0", "c@3.0.0"];
      const results = runner.checkBatch(specs);

      expect(results.map((r) => r.packageSpec)).toEqual(specs);
    });
  });
});
