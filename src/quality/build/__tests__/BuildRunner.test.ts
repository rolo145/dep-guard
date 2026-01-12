import { describe, it, expect, vi, beforeEach } from "vitest";

const mockTryRunCommand = vi.fn();

vi.mock("../../../utils/command", () => ({
  tryRunCommand: (...args: unknown[]) => mockTryRunCommand(...args),
}));

import { BuildRunner } from "../BuildRunner";

describe("BuildRunner", () => {
  let runner: BuildRunner;

  beforeEach(() => {
    vi.clearAllMocks();
    runner = new BuildRunner();
  });

  describe("run()", () => {
    it("executes npm run with script name", () => {
      mockTryRunCommand.mockReturnValue(true);

      runner.run("build");

      expect(mockTryRunCommand).toHaveBeenCalledWith("npm", ["run", "build"]);
    });

    it("returns script name in result", () => {
      mockTryRunCommand.mockReturnValue(true);

      const result = runner.run("custom-build");

      expect(result.scriptName).toBe("custom-build");
    });

    it("returns success true when command succeeds", () => {
      mockTryRunCommand.mockReturnValue(true);

      const result = runner.run("build");

      expect(result.success).toBeTruthy();
    });

    it("returns success false when command fails", () => {
      mockTryRunCommand.mockReturnValue(false);

      const result = runner.run("build");

      expect(result.success).toBeFalsy();
    });

    it("works with custom script names", () => {
      mockTryRunCommand.mockReturnValue(true);

      runner.run("build:prod");

      expect(mockTryRunCommand).toHaveBeenCalledWith("npm", ["run", "build:prod"]);
    });
  });
});
