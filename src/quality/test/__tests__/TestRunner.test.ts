import { describe, it, expect, vi, beforeEach } from "vitest";

const mockTryRunCommand = vi.fn();

vi.mock("../../../utils/command", () => ({
  tryRunCommand: (...args: unknown[]) => mockTryRunCommand(...args),
}));

import { TestRunner } from "../TestRunner";

describe("TestRunner", () => {
  let runner: TestRunner;

  beforeEach(() => {
    vi.clearAllMocks();
    runner = new TestRunner();
  });

  describe("run()", () => {
    it("executes npm run with script name", () => {
      mockTryRunCommand.mockReturnValue(true);

      runner.run("test");

      expect(mockTryRunCommand).toHaveBeenCalledWith("npm", ["run", "test"]);
    });

    it("returns script name in result", () => {
      mockTryRunCommand.mockReturnValue(true);

      const result = runner.run("custom-test");

      expect(result.scriptName).toBe("custom-test");
    });

    it("returns success true when command succeeds", () => {
      mockTryRunCommand.mockReturnValue(true);

      const result = runner.run("test");

      expect(result.success).toBe(true);
    });

    it("returns success false when command fails", () => {
      mockTryRunCommand.mockReturnValue(false);

      const result = runner.run("test");

      expect(result.success).toBe(false);
    });

    it("works with custom script names", () => {
      mockTryRunCommand.mockReturnValue(true);

      runner.run("test:unit");

      expect(mockTryRunCommand).toHaveBeenCalledWith("npm", ["run", "test:unit"]);
    });
  });
});
