import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../npq/NPQRunner");
vi.mock("../../allowlist/AllowlistReader");
vi.mock("../../logger", () => ({
  logger: {
    header: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    newLine: vi.fn(),
    error: vi.fn(),
  },
}));

import { NpqWorkflowOrchestrator } from "../NpqWorkflowOrchestrator";
import { NPQRunner } from "../../npq/NPQRunner";
import { AllowlistReader } from "../../allowlist/AllowlistReader";

describe("NpqWorkflowOrchestrator", () => {
  let mockRunner: { checkCapturingOutput: ReturnType<typeof vi.fn> };
  let mockAllowlist: { check: ReturnType<typeof vi.fn>; getPatternsFor: ReturnType<typeof vi.fn> };
  let stdoutSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRunner = { checkCapturingOutput: vi.fn() };
    mockAllowlist = {
      check: vi.fn(),
      getPatternsFor: vi.fn().mockReturnValue([]),
    };

    vi.mocked(NPQRunner).mockImplementation(function (this: any) {
      return mockRunner;
    } as any);

    vi.mocked(AllowlistReader).mockImplementation(function (this: any) {
      return mockAllowlist;
    } as any);

    stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  });

  describe("execute() - JSON mode", () => {
    it("outputs valid JSON when NPQ passes", async () => {
      mockRunner.checkCapturingOutput.mockReturnValue({
        packageSpec: "lodash@4.17.21",
        passed: true,
        outputLines: [],
      });
      mockAllowlist.check.mockReturnValue({ allowlisted: [], unmatched: [], allAllowlisted: true });

      const orchestrator = new NpqWorkflowOrchestrator({
        packageSpec: "lodash@4.17.21",
        json: true,
      });

      const result = await orchestrator.execute();

      expect(result.exitCode).toBe(0);
      expect(stdoutSpy).toHaveBeenCalledOnce();
      const output = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
      expect(output).toMatchObject({
        package: "lodash@4.17.21",
        passed: true,
        requiresUserDecision: false,
        issues: [],
        allowlisted: [],
      });
    });

    it("sets requiresUserDecision: false when NPQ fails but all issues are allowlisted", async () => {
      mockRunner.checkCapturingOutput.mockReturnValue({
        packageSpec: "lodash@4.17.21",
        passed: false,
        outputLines: ["No provenance"],
      });
      mockAllowlist.check.mockReturnValue({
        allowlisted: ["No provenance"],
        unmatched: [],
        allAllowlisted: true,
      });

      const orchestrator = new NpqWorkflowOrchestrator({
        packageSpec: "lodash@4.17.21",
        json: true,
      });

      const result = await orchestrator.execute();

      expect(result.exitCode).toBe(0);
      const output = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
      expect(output.requiresUserDecision).toBe(false);
      expect(output.passed).toBe(false);
      expect(output.allowlisted).toStrictEqual(["No provenance"]);
    });

    it("sets requiresUserDecision: true when NPQ fails with unmatched issues", async () => {
      mockRunner.checkCapturingOutput.mockReturnValue({
        packageSpec: "risky@1.0.0",
        passed: false,
        outputLines: ["Malware detected", "No provenance"],
      });
      mockAllowlist.check.mockReturnValue({
        allowlisted: [],
        unmatched: ["Malware detected", "No provenance"],
        allAllowlisted: false,
      });

      const orchestrator = new NpqWorkflowOrchestrator({
        packageSpec: "risky@1.0.0",
        json: true,
      });

      const result = await orchestrator.execute();

      expect(result.exitCode).toBe(1);
      const output = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
      expect(output.requiresUserDecision).toBe(true);
      expect(output.issues).toStrictEqual(["Malware detected", "No provenance"]);
    });

    it("includes issues in JSON output when NPQ fails", async () => {
      mockRunner.checkCapturingOutput.mockReturnValue({
        packageSpec: "pkg@1.0.0",
        passed: false,
        outputLines: ["Issue A", "Issue B"],
      });
      mockAllowlist.check.mockReturnValue({
        allowlisted: ["Issue A"],
        unmatched: ["Issue B"],
        allAllowlisted: false,
      });

      const orchestrator = new NpqWorkflowOrchestrator({
        packageSpec: "pkg@1.0.0",
        json: true,
      });

      const result = await orchestrator.execute();

      expect(result.exitCode).toBe(1);
      const output = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
      expect(output.issues).toStrictEqual(["Issue A", "Issue B"]);
      expect(output.allowlisted).toStrictEqual(["Issue A"]);
    });

    it("does not include issues when NPQ passes", async () => {
      // When NPQ passes, outputLines is empty (no ERROR/WARNING lines found)
      mockRunner.checkCapturingOutput.mockReturnValue({
        packageSpec: "safe@1.0.0",
        passed: true,
        outputLines: [],
      });
      mockAllowlist.check.mockReturnValue({ allowlisted: [], unmatched: [], allAllowlisted: true });

      const orchestrator = new NpqWorkflowOrchestrator({
        packageSpec: "safe@1.0.0",
        json: true,
      });

      await orchestrator.execute();

      const output = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
      expect(output.issues).toStrictEqual([]);
    });
  });

  describe("execute() - runner error handling", () => {
    it("emits error JSON and exits 1 when runner throws in JSON mode", async () => {
      mockRunner.checkCapturingOutput.mockImplementation(() => {
        throw new Error("spawn npq ENOENT");
      });

      const orchestrator = new NpqWorkflowOrchestrator({
        packageSpec: "lodash@4.17.21",
        json: true,
      });

      const result = await orchestrator.execute();

      expect(result.exitCode).toBe(1);
      const output = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
      expect(output.passed).toBe(false);
      expect(output.requiresUserDecision).toBe(true);
      expect(output.issues).toContain("spawn npq ENOENT");
    });

    it("exits 1 without writing JSON when runner throws in human-readable mode", async () => {
      mockRunner.checkCapturingOutput.mockImplementation(() => {
        throw new Error("spawn npq ENOENT");
      });

      const orchestrator = new NpqWorkflowOrchestrator({
        packageSpec: "lodash@4.17.21",
        json: false,
      });

      const result = await orchestrator.execute();

      expect(result.exitCode).toBe(1);
      expect(stdoutSpy).not.toHaveBeenCalled();
    });
  });

  describe("execute() - human-readable mode", () => {
    it("does not write to stdout in human-readable mode", async () => {
      mockRunner.checkCapturingOutput.mockReturnValue({
        packageSpec: "lodash@4.17.21",
        passed: true,
        outputLines: [],
      });
      mockAllowlist.check.mockReturnValue({ allowlisted: [], unmatched: [], allAllowlisted: true });

      const orchestrator = new NpqWorkflowOrchestrator({
        packageSpec: "lodash@4.17.21",
        json: false,
      });

      await orchestrator.execute();

      expect(stdoutSpy).not.toHaveBeenCalled();
    });

    it("returns exitCode 0 on success", async () => {
      mockRunner.checkCapturingOutput.mockReturnValue({
        packageSpec: "lodash@4.17.21",
        passed: true,
        outputLines: [],
      });
      mockAllowlist.check.mockReturnValue({ allowlisted: [], unmatched: [], allAllowlisted: true });

      const orchestrator = new NpqWorkflowOrchestrator({
        packageSpec: "lodash@4.17.21",
        json: false,
      });

      const result = await orchestrator.execute();

      expect(result.exitCode).toBe(0);
    });
  });

  describe("execute() - package name parsing", () => {
    it("extracts package name from spec for allowlist lookup", async () => {
      mockRunner.checkCapturingOutput.mockReturnValue({
        packageSpec: "lodash@4.17.21",
        passed: false,
        outputLines: ["Warning"],
      });
      mockAllowlist.check.mockReturnValue({ allowlisted: [], unmatched: ["Warning"], allAllowlisted: false });

      const orchestrator = new NpqWorkflowOrchestrator({
        packageSpec: "lodash@4.17.21",
        json: true,
      });

      await orchestrator.execute();

      expect(mockAllowlist.check).toHaveBeenCalledWith("lodash", ["Warning"]);
    });

    it("correctly parses scoped package names", async () => {
      mockRunner.checkCapturingOutput.mockReturnValue({
        packageSpec: "@vue/reactivity@3.0.0",
        passed: false,
        outputLines: ["Warning"],
      });
      mockAllowlist.check.mockReturnValue({ allowlisted: [], unmatched: ["Warning"], allAllowlisted: false });

      const orchestrator = new NpqWorkflowOrchestrator({
        packageSpec: "@vue/reactivity@3.0.0",
        json: true,
      });

      await orchestrator.execute();

      expect(mockAllowlist.check).toHaveBeenCalledWith("@vue/reactivity", ["Warning"]);
    });

    it("handles package spec without version", async () => {
      mockRunner.checkCapturingOutput.mockReturnValue({
        packageSpec: "lodash",
        passed: true,
        outputLines: [],
      });
      mockAllowlist.check.mockReturnValue({ allowlisted: [], unmatched: [], allAllowlisted: true });

      const orchestrator = new NpqWorkflowOrchestrator({
        packageSpec: "lodash",
        json: true,
      });

      await orchestrator.execute();

      expect(mockAllowlist.check).toHaveBeenCalledWith("lodash", []);
    });
  });
});
