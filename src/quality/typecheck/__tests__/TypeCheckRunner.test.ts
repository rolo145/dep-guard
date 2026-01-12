import { describe, it, expect, vi, beforeEach } from "vitest";

const mockTryRunCommand = vi.fn();

vi.mock("../../../utils/command", () => ({
  tryRunCommand: (...args: unknown[]) => mockTryRunCommand(...args),
}));

import { TypeCheckRunner } from "../TypeCheckRunner";

describe("TypeCheckRunner", () => {
  let runner: TypeCheckRunner;

  beforeEach(() => {
    vi.clearAllMocks();
    runner = new TypeCheckRunner();
  });

  describe("run()", () => {
    it("executes npm run with script name", () => {
      mockTryRunCommand.mockReturnValue(true);

      runner.run("typecheck");

      expect(mockTryRunCommand).toHaveBeenCalledWith("npm", ["run", "typecheck"]);
    });

    it("returns script name in result", () => {
      mockTryRunCommand.mockReturnValue(true);

      const result = runner.run("custom-typecheck");

      expect(result.scriptName).toBe("custom-typecheck");
    });

    it("returns success true when command succeeds", () => {
      mockTryRunCommand.mockReturnValue(true);

      const result = runner.run("typecheck");

      expect(result.success).toBe(true);
    });

    it("returns success false when command fails", () => {
      mockTryRunCommand.mockReturnValue(false);

      const result = runner.run("typecheck");

      expect(result.success).toBe(false);
    });

    it("works with custom script names", () => {
      mockTryRunCommand.mockReturnValue(true);

      runner.run("tsc:check");

      expect(mockTryRunCommand).toHaveBeenCalledWith("npm", ["run", "tsc:check"]);
    });
  });
});
