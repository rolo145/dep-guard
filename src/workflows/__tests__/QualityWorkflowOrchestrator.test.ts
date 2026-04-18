import { describe, it, expect, vi, beforeEach } from "vitest";

const mockContext = {
  cutoff: new Date(),
  cutoffIso: new Date().toISOString(),
  days: 7,
  allDependencies: {},
  dependencies: {},
  devDependencies: {},
  scripts: {},
  scriptNames: { lint: "lint", typecheck: "typecheck", test: "test", build: "build" },
  raw: {},
  hasScript: vi.fn(),
  hasPackage: vi.fn(),
  getPackageVersion: vi.fn(),
};

vi.mock("../../context/ExecutionContextFactory", () => ({
  ExecutionContextFactory: {
    create: vi.fn(() => mockContext),
  },
}));

vi.mock("../../quality/lint/LintRunner");
vi.mock("../../quality/typecheck/TypeCheckRunner");
vi.mock("../../quality/test/TestRunner");
vi.mock("../../quality/build/BuildRunner");

vi.mock("../../logger", () => ({
  logger: {
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    skip: vi.fn(),
    newLine: vi.fn(),
  },
}));

import { QualityWorkflowOrchestrator } from "../QualityWorkflowOrchestrator";
import { LintRunner } from "../../quality/lint/LintRunner";
import { TypeCheckRunner } from "../../quality/typecheck/TypeCheckRunner";
import { TestRunner } from "../../quality/test/TestRunner";
import { BuildRunner } from "../../quality/build/BuildRunner";

const SCRIPTS = { lint: "lint", typecheck: "typecheck", test: "test", build: "build" };

describe("QualityWorkflowOrchestrator", () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>;
  let mockLintRunner: { run: ReturnType<typeof vi.fn> };
  let mockTypeCheckRunner: { run: ReturnType<typeof vi.fn> };
  let mockTestRunner: { run: ReturnType<typeof vi.fn> };
  let mockBuildRunner: { run: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    // Default: all scripts exist and pass
    mockContext.hasScript.mockReturnValue(true);

    mockLintRunner = { run: vi.fn().mockReturnValue({ success: true }) };
    mockTypeCheckRunner = { run: vi.fn().mockReturnValue({ success: true }) };
    mockTestRunner = { run: vi.fn().mockReturnValue({ success: true }) };
    mockBuildRunner = { run: vi.fn().mockReturnValue({ success: true }) };

    vi.mocked(LintRunner).mockImplementation(function (this: any) { return mockLintRunner; } as any);
    vi.mocked(TypeCheckRunner).mockImplementation(function (this: any) { return mockTypeCheckRunner; } as any);
    vi.mocked(TestRunner).mockImplementation(function (this: any) { return mockTestRunner; } as any);
    vi.mocked(BuildRunner).mockImplementation(function (this: any) { return mockBuildRunner; } as any);
  });

  describe("execute() - JSON mode, all pass", () => {
    it("outputs valid JSON with all checks passing", async () => {
      const orchestrator = new QualityWorkflowOrchestrator({
        scripts: SCRIPTS,
        days: 7,
        json: true,
      });

      const result = await orchestrator.execute();

      expect(result.exitCode).toBe(0);
      const output = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
      expect(output.success).toBe(true);
      expect(output.checks.lint).toMatchObject({ ran: true, passed: true, skipped: false });
      expect(output.checks.typecheck).toMatchObject({ ran: true, passed: true, skipped: false });
      expect(output.checks.test).toMatchObject({ ran: true, passed: true, skipped: false });
      expect(output.checks.build).toMatchObject({ ran: true, passed: true, skipped: false });
    });

    it("returns exitCode 0 when all checks pass", async () => {
      const orchestrator = new QualityWorkflowOrchestrator({ scripts: SCRIPTS, days: 7, json: true });

      const result = await orchestrator.execute();

      expect(result.exitCode).toBe(0);
    });
  });

  describe("execute() - JSON mode, check failures", () => {
    it("reports failure when lint fails", async () => {
      mockLintRunner.run.mockReturnValue({ success: false });

      const orchestrator = new QualityWorkflowOrchestrator({ scripts: SCRIPTS, days: 7, json: true });

      const result = await orchestrator.execute();

      expect(result.exitCode).toBe(1);
      const output = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
      expect(output.success).toBe(false);
      expect(output.checks.lint).toMatchObject({ ran: true, passed: false, skipped: false });
    });

    it("reports failure when typecheck fails", async () => {
      mockTypeCheckRunner.run.mockReturnValue({ success: false });

      const orchestrator = new QualityWorkflowOrchestrator({ scripts: SCRIPTS, days: 7, json: true });

      const result = await orchestrator.execute();

      expect(result.exitCode).toBe(1);
      const output = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
      expect(output.checks.typecheck.passed).toBe(false);
    });

    it("reports failure when tests fail", async () => {
      mockTestRunner.run.mockReturnValue({ success: false });

      const orchestrator = new QualityWorkflowOrchestrator({ scripts: SCRIPTS, days: 7, json: true });

      const result = await orchestrator.execute();

      expect(result.exitCode).toBe(1);
      const output = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
      expect(output.checks.test.passed).toBe(false);
    });

    it("reports failure when build fails", async () => {
      mockBuildRunner.run.mockReturnValue({ success: false });

      const orchestrator = new QualityWorkflowOrchestrator({ scripts: SCRIPTS, days: 7, json: true });

      const result = await orchestrator.execute();

      expect(result.exitCode).toBe(1);
      const output = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
      expect(output.checks.build.passed).toBe(false);
    });

    it("reports overall failure even when only one check fails", async () => {
      mockBuildRunner.run.mockReturnValue({ success: false });

      const orchestrator = new QualityWorkflowOrchestrator({ scripts: SCRIPTS, days: 7, json: true });

      const result = await orchestrator.execute();

      const output = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
      expect(output.success).toBe(false);
      expect(output.checks.lint.passed).toBe(true);
      expect(output.checks.build.passed).toBe(false);
    });
  });

  describe("execute() - JSON mode, skipped checks", () => {
    it("marks check as skipped when script is not found", async () => {
      mockContext.hasScript.mockImplementation((name: string) => name !== "lint");

      const orchestrator = new QualityWorkflowOrchestrator({ scripts: SCRIPTS, days: 7, json: true });

      const result = await orchestrator.execute();

      expect(result.exitCode).toBe(0);
      const output = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
      expect(output.checks.lint).toMatchObject({ ran: false, passed: null, skipped: true });
    });

    it("treats skipped checks as success for overall result", async () => {
      mockContext.hasScript.mockReturnValue(false);

      const orchestrator = new QualityWorkflowOrchestrator({ scripts: SCRIPTS, days: 7, json: true });

      const result = await orchestrator.execute();

      expect(result.exitCode).toBe(0);
      const output = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
      expect(output.success).toBe(true);
    });

    it("does not run skipped checks", async () => {
      mockContext.hasScript.mockReturnValue(false);

      const orchestrator = new QualityWorkflowOrchestrator({ scripts: SCRIPTS, days: 7, json: true });

      await orchestrator.execute();

      expect(mockLintRunner.run).not.toHaveBeenCalled();
      expect(mockTypeCheckRunner.run).not.toHaveBeenCalled();
      expect(mockTestRunner.run).not.toHaveBeenCalled();
      expect(mockBuildRunner.run).not.toHaveBeenCalled();
    });
  });

  describe("execute() - human-readable mode", () => {
    it("does not write JSON to stdout", async () => {
      const orchestrator = new QualityWorkflowOrchestrator({ scripts: SCRIPTS, days: 7, json: false });

      await orchestrator.execute();

      expect(stdoutSpy).not.toHaveBeenCalled();
    });

    it("returns exitCode 0 when all checks pass", async () => {
      const orchestrator = new QualityWorkflowOrchestrator({ scripts: SCRIPTS, days: 7, json: false });

      const result = await orchestrator.execute();

      expect(result.exitCode).toBe(0);
    });

    it("returns exitCode 1 when any check fails", async () => {
      mockTestRunner.run.mockReturnValue({ success: false });

      const orchestrator = new QualityWorkflowOrchestrator({ scripts: SCRIPTS, days: 7, json: false });

      const result = await orchestrator.execute();

      expect(result.exitCode).toBe(1);
    });
  });

  describe("execute() - runner invocation", () => {
    it("passes correct script name to each runner", async () => {
      const customScripts = { lint: "my-lint", typecheck: "my-tsc", test: "my-test", build: "my-build" };

      const orchestrator = new QualityWorkflowOrchestrator({
        scripts: customScripts,
        days: 7,
        json: true,
      });

      await orchestrator.execute();

      expect(mockLintRunner.run).toHaveBeenCalledWith("my-lint");
      expect(mockTypeCheckRunner.run).toHaveBeenCalledWith("my-tsc");
      expect(mockTestRunner.run).toHaveBeenCalledWith("my-test");
      expect(mockBuildRunner.run).toHaveBeenCalledWith("my-build");
    });
  });
});
