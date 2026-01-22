import { describe, it, expect, vi, beforeEach } from "vitest";
import { SCFWRunner } from "../SCFWRunner";
import { ExecutionContextFactory } from "../../../context/ExecutionContextFactory";

// Mock the command utility
vi.mock("../../../utils/command", () => ({
  tryRunCommand: vi.fn(),
}));

import { tryRunCommand } from "../../../utils/command";

describe("SCFWRunner", () => {
  const mockContext = ExecutionContextFactory.createMock({
    cutoffIso: "2024-01-01T00:00:00.000Z",
  });

  let runner: SCFWRunner;

  beforeEach(() => {
    vi.clearAllMocks();
    runner = new SCFWRunner(mockContext);
  });

  describe("install()", () => {
    it("executes scfw with correct arguments", () => {
      vi.mocked(tryRunCommand).mockReturnValue(true);

      runner.install(["chalk@5.0.0"]);

      expect(tryRunCommand).toHaveBeenCalledWith("scfw", [
        "run",
        "npm",
        "install",
        "chalk@5.0.0",
        "--save-exact",
        "--ignore-scripts",
        "--before",
        "2024-01-01T00:00:00.000Z",
      ]);
    });

    it("handles multiple packages", () => {
      vi.mocked(tryRunCommand).mockReturnValue(true);

      runner.install(["chalk@5.0.0", "lodash@4.17.21"]);

      expect(tryRunCommand).toHaveBeenCalledWith("scfw", [
        "run",
        "npm",
        "install",
        "chalk@5.0.0",
        "lodash@4.17.21",
        "--save-exact",
        "--ignore-scripts",
        "--before",
        "2024-01-01T00:00:00.000Z",
      ]);
    });

    it("returns success: true and packageSpecs when command succeeds", () => {
      vi.mocked(tryRunCommand).mockReturnValue(true);

      const result = runner.install(["chalk@5.0.0"]);

      expect(result.success).toBeTruthy();
      expect(result.packageSpecs).toStrictEqual(["chalk@5.0.0"]);
    });

    it("returns success: false when command fails", () => {
      vi.mocked(tryRunCommand).mockReturnValue(false);

      const result = runner.install(["chalk@5.0.0"]);

      expect(result.success).toBeFalsy();
      expect(result.packageSpecs).toStrictEqual(["chalk@5.0.0"]);
    });
  });

  describe("installSingle()", () => {
    it("delegates to install with single package array", () => {
      vi.mocked(tryRunCommand).mockReturnValue(true);

      const result = runner.installSingle("chalk@5.0.0");

      expect(tryRunCommand).toHaveBeenCalledWith("scfw", expect.arrayContaining(["chalk@5.0.0"]));
      expect(result.packageSpecs).toStrictEqual(["chalk@5.0.0"]);
    });
  });

  describe("--save-dev flag", () => {
    it("includes --save-dev flag when saveDev is true", () => {
      vi.mocked(tryRunCommand).mockReturnValue(true);

      runner.install(["typescript@5.0.0"], true);

      expect(tryRunCommand).toHaveBeenCalledWith("scfw", [
        "run",
        "npm",
        "install",
        "typescript@5.0.0",
        "--save-exact",
        "--ignore-scripts",
        "--before",
        "2024-01-01T00:00:00.000Z",
        "--save-dev",
      ]);
    });

    it("omits --save-dev flag when saveDev is false", () => {
      vi.mocked(tryRunCommand).mockReturnValue(true);

      runner.install(["typescript@5.0.0"], false);

      expect(tryRunCommand).toHaveBeenCalledWith("scfw", [
        "run",
        "npm",
        "install",
        "typescript@5.0.0",
        "--save-exact",
        "--ignore-scripts",
        "--before",
        "2024-01-01T00:00:00.000Z",
      ]);
    });

    it("omits --save-dev flag when saveDev is not provided", () => {
      vi.mocked(tryRunCommand).mockReturnValue(true);

      runner.install(["typescript@5.0.0"]);

      expect(tryRunCommand).toHaveBeenCalledWith("scfw", [
        "run",
        "npm",
        "install",
        "typescript@5.0.0",
        "--save-exact",
        "--ignore-scripts",
        "--before",
        "2024-01-01T00:00:00.000Z",
      ]);
    });

    it("includes --save-dev flag in installSingle when saveDev is true", () => {
      vi.mocked(tryRunCommand).mockReturnValue(true);

      runner.installSingle("typescript@5.0.0", true);

      expect(tryRunCommand).toHaveBeenCalledWith("scfw", expect.arrayContaining(["--save-dev"]));
    });
  });
});
