import { describe, it, expect, vi, beforeEach } from "vitest";
import { SCFWRunner } from "../SCFWRunner";
import { ExecutionContextFactory } from "../../../context/ExecutionContextFactory";

// Mock the command utility
vi.mock("../../../utils/command", () => ({
  runWithOutput: vi.fn(),
}));

import { runWithOutput } from "../../../utils/command";

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
      vi.mocked(runWithOutput).mockReturnValue({ success: true, output: "" });

      runner.install(["chalk@5.0.0"]);

      expect(runWithOutput).toHaveBeenCalledWith("scfw", [
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
      vi.mocked(runWithOutput).mockReturnValue({ success: true, output: "" });

      runner.install(["chalk@5.0.0", "lodash@4.17.21"]);

      expect(runWithOutput).toHaveBeenCalledWith("scfw", [
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
      vi.mocked(runWithOutput).mockReturnValue({ success: true, output: "" });

      const result = runner.install(["chalk@5.0.0"]);

      expect(result.success).toBeTruthy();
      expect(result.packageSpecs).toStrictEqual(["chalk@5.0.0"]);
    });

    it("returns success: false when scfw outputs block message (exits 0 but aborted)", () => {
      vi.mocked(runWithOutput).mockReturnValue({
        success: true, // scfw exits 0 even when blocking
        output: "The installation request was aborted. No changes have been made.",
      });

      const result = runner.install(["lodash@4.17.21"]);

      expect(result.success).toBe(false);
      expect(result.packageSpecs).toStrictEqual(["lodash@4.17.21"]);
    });

    it("returns success: false when command exits non-zero", () => {
      vi.mocked(runWithOutput).mockReturnValue({ success: false, output: "some error" });

      const result = runner.install(["chalk@5.0.0"]);

      expect(result.success).toBeFalsy();
      expect(result.packageSpecs).toStrictEqual(["chalk@5.0.0"]);
    });
  });

  describe("installSingle()", () => {
    it("delegates to install with single package array", () => {
      vi.mocked(runWithOutput).mockReturnValue({ success: true, output: "" });

      const result = runner.installSingle("chalk@5.0.0");

      expect(runWithOutput).toHaveBeenCalledWith("scfw", expect.arrayContaining(["chalk@5.0.0"]));
      expect(result.packageSpecs).toStrictEqual(["chalk@5.0.0"]);
    });
  });

  describe("--save-dev flag", () => {
    it("includes --save-dev flag when saveDev is true", () => {
      vi.mocked(runWithOutput).mockReturnValue({ success: true, output: "" });

      runner.install(["typescript@5.0.0"], true);

      expect(runWithOutput).toHaveBeenCalledWith("scfw", [
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
      vi.mocked(runWithOutput).mockReturnValue({ success: true, output: "" });

      runner.install(["typescript@5.0.0"], false);

      expect(runWithOutput).toHaveBeenCalledWith("scfw", [
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
      vi.mocked(runWithOutput).mockReturnValue({ success: true, output: "" });

      runner.install(["typescript@5.0.0"]);

      expect(runWithOutput).toHaveBeenCalledWith("scfw", [
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
      vi.mocked(runWithOutput).mockReturnValue({ success: true, output: "" });

      runner.installSingle("typescript@5.0.0", true);

      expect(runWithOutput).toHaveBeenCalledWith("scfw", expect.arrayContaining(["--save-dev"]));
    });
  });
});
