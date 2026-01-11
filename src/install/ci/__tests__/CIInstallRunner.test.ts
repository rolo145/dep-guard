import { describe, it, expect, vi, beforeEach } from "vitest";
import { CIInstallRunner } from "../CIInstallRunner";

// Mock the command utility
vi.mock("../../../utils/command", () => ({
  tryRunCommand: vi.fn(),
}));

import { tryRunCommand } from "../../../utils/command";

describe("CIInstallRunner", () => {
  let runner: CIInstallRunner;

  beforeEach(() => {
    vi.clearAllMocks();
    runner = new CIInstallRunner();
  });

  describe("run()", () => {
    it("executes npm ci with --ignore-scripts flag", () => {
      vi.mocked(tryRunCommand).mockReturnValue(true);

      runner.run();

      expect(tryRunCommand).toHaveBeenCalledWith("npm", ["ci", "--ignore-scripts"]);
    });

    it("returns success: true when command succeeds", () => {
      vi.mocked(tryRunCommand).mockReturnValue(true);

      const result = runner.run();

      expect(result.success).toBeTruthy();
    });

    it("returns success: false when command fails", () => {
      vi.mocked(tryRunCommand).mockReturnValue(false);

      const result = runner.run();

      expect(result.success).toBeFalsy();
    });
  });
});
