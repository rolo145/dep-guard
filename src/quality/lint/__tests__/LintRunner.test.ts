import { describe, it, expect, vi, beforeEach } from "vitest";

const mockTryRunCommand = vi.fn();

vi.mock("../../../utils/command", () => ({
  tryRunCommand: (...args: unknown[]) => mockTryRunCommand(...args),
}));

import { LintRunner } from "../LintRunner";

describe("LintRunner", () => {
  let runner: LintRunner;

  beforeEach(() => {
    vi.clearAllMocks();
    runner = new LintRunner();
  });

  describe("run()", () => {
    it("executes npm run with script name", () => {
      mockTryRunCommand.mockReturnValue(true);

      runner.run("lint");

      expect(mockTryRunCommand).toHaveBeenCalledWith("npm", ["run", "lint"]);
    });

    it("returns script name in result", () => {
      mockTryRunCommand.mockReturnValue(true);

      const result = runner.run("custom-lint");

      expect(result.scriptName).toBe("custom-lint");
    });

    it("returns success true when command succeeds", () => {
      mockTryRunCommand.mockReturnValue(true);

      const result = runner.run("lint");

      expect(result.success).toBe(true);
    });

    it("returns success false when command fails", () => {
      mockTryRunCommand.mockReturnValue(false);

      const result = runner.run("lint");

      expect(result.success).toBe(false);
    });

    it("works with custom script names", () => {
      mockTryRunCommand.mockReturnValue(true);

      runner.run("eslint:check");

      expect(mockTryRunCommand).toHaveBeenCalledWith("npm", ["run", "eslint:check"]);
    });
  });
});
