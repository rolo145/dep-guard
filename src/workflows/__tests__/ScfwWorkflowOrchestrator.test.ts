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

vi.mock("../../install/scfw/SCFWRunner");
vi.mock("../../install/npm/NpmInstallRunner");

vi.mock("../../logger", () => ({
  logger: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import { ScfwWorkflowOrchestrator } from "../ScfwWorkflowOrchestrator";
import { SCFWRunner } from "../../install/scfw/SCFWRunner";
import { NpmInstallRunner } from "../../install/npm/NpmInstallRunner";

const SCRIPTS = { lint: "lint", typecheck: "typecheck", test: "test", build: "build" };

describe("ScfwWorkflowOrchestrator", () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>;
  let mockSCFWRunner: { install: ReturnType<typeof vi.fn> };
  let mockNpmInstallRunner: { install: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    mockSCFWRunner = { install: vi.fn().mockReturnValue({ packageSpecs: [], success: true }) };
    mockNpmInstallRunner = { install: vi.fn().mockReturnValue({ packageSpecs: [], success: true }) };

    vi.mocked(SCFWRunner).mockImplementation(function (this: any) { return mockSCFWRunner; } as any);
    vi.mocked(NpmInstallRunner).mockImplementation(function (this: any) { return mockNpmInstallRunner; } as any);
  });

  describe("execute() - package spec validation", () => {
    it("rejects a package spec without a version in JSON mode", async () => {
      const orchestrator = new ScfwWorkflowOrchestrator({
        packageSpecs: ["lodash"],
        useNpmFallback: false,
        days: 7,
        scripts: SCRIPTS,
        json: true,
      });

      const result = await orchestrator.execute();

      expect(result.exitCode).toBe(1);
      const output = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
      expect(output.success).toBe(false);
      expect(output.error).toContain("lodash");
      expect(mockSCFWRunner.install).not.toHaveBeenCalled();
    });

    it("rejects a scoped package spec without a version in JSON mode", async () => {
      const orchestrator = new ScfwWorkflowOrchestrator({
        packageSpecs: ["@vue/cli"],
        useNpmFallback: false,
        days: 7,
        scripts: SCRIPTS,
        json: true,
      });

      const result = await orchestrator.execute();

      expect(result.exitCode).toBe(1);
      const output = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
      expect(output.success).toBe(false);
      expect(mockSCFWRunner.install).not.toHaveBeenCalled();
    });

    it("rejects unversioned package among valid ones in JSON mode", async () => {
      const orchestrator = new ScfwWorkflowOrchestrator({
        packageSpecs: ["lodash@4.17.21", "chalk"],
        useNpmFallback: false,
        days: 7,
        scripts: SCRIPTS,
        json: true,
      });

      const result = await orchestrator.execute();

      expect(result.exitCode).toBe(1);
      const output = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
      expect(output.success).toBe(false);
      expect(output.error).toContain("chalk");
      expect(mockSCFWRunner.install).not.toHaveBeenCalled();
    });

    it("rejects unversioned package in human-readable mode", async () => {
      const orchestrator = new ScfwWorkflowOrchestrator({
        packageSpecs: ["lodash"],
        useNpmFallback: false,
        days: 7,
        scripts: SCRIPTS,
        json: false,
      });

      const result = await orchestrator.execute();

      expect(result.exitCode).toBe(1);
      expect(mockSCFWRunner.install).not.toHaveBeenCalled();
    });

    it("accepts all versioned packages and proceeds to install", async () => {
      mockSCFWRunner.install.mockReturnValue({ success: true });

      const orchestrator = new ScfwWorkflowOrchestrator({
        packageSpecs: ["lodash@4.17.21", "@vue/cli@5.0.0"],
        useNpmFallback: false,
        days: 7,
        scripts: SCRIPTS,
        json: true,
      });

      const result = await orchestrator.execute();

      expect(result.exitCode).toBe(0);
      expect(mockSCFWRunner.install).toHaveBeenCalledWith(["lodash@4.17.21", "@vue/cli@5.0.0"]);
    });
  });

  describe("execute() - JSON mode", () => {
    it("outputs valid JSON on successful SCFW install", async () => {
      mockSCFWRunner.install.mockReturnValue({
        packageSpecs: ["lodash@4.17.21"],
        success: true,
      });

      const orchestrator = new ScfwWorkflowOrchestrator({
        packageSpecs: ["lodash@4.17.21"],
        useNpmFallback: false,
        days: 7,
        scripts: SCRIPTS,
        json: true,
      });

      const result = await orchestrator.execute();

      expect(result.exitCode).toBe(0);
      const output = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
      expect(output).toMatchObject({
        success: true,
        packages: ["lodash@4.17.21"],
        error: null,
      });
    });

    it("outputs failure JSON when SCFW install fails", async () => {
      mockSCFWRunner.install.mockReturnValue({ packageSpecs: ["bad@1.0.0"], success: false });

      const orchestrator = new ScfwWorkflowOrchestrator({
        packageSpecs: ["bad@1.0.0"],
        useNpmFallback: false,
        days: 7,
        scripts: SCRIPTS,
        json: true,
      });

      const result = await orchestrator.execute();

      expect(result.exitCode).toBe(1);
      const output = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
      expect(output.success).toBe(false);
      expect(output.error).toBeTruthy();
    });

    it("outputs error JSON when no packages specified", async () => {
      const orchestrator = new ScfwWorkflowOrchestrator({
        packageSpecs: [],
        useNpmFallback: false,
        days: 7,
        scripts: SCRIPTS,
        json: true,
      });

      const result = await orchestrator.execute();

      expect(result.exitCode).toBe(1);
      const output = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
      expect(output.success).toBe(false);
      expect(output.error).toBeTruthy();
    });

    it("includes all package specs in JSON output", async () => {
      mockSCFWRunner.install.mockReturnValue({ success: true });

      const packages = ["lodash@4.17.21", "chalk@5.0.0", "express@4.18.0"];
      const orchestrator = new ScfwWorkflowOrchestrator({
        packageSpecs: packages,
        useNpmFallback: false,
        days: 7,
        scripts: SCRIPTS,
        json: true,
      });

      await orchestrator.execute();

      const output = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
      expect(output.packages).toStrictEqual(packages);
    });
  });

  describe("execute() - npm fallback mode", () => {
    it("uses NpmInstallRunner when useNpmFallback is true", async () => {
      mockNpmInstallRunner.install.mockReturnValue({ success: true });

      const orchestrator = new ScfwWorkflowOrchestrator({
        packageSpecs: ["lodash@4.17.21"],
        useNpmFallback: true,
        days: 7,
        scripts: SCRIPTS,
        json: true,
      });

      await orchestrator.execute();

      expect(mockNpmInstallRunner.install).toHaveBeenCalledWith(["lodash@4.17.21"]);
      expect(mockSCFWRunner.install).not.toHaveBeenCalled();
    });

    it("uses SCFWRunner when useNpmFallback is false", async () => {
      mockSCFWRunner.install.mockReturnValue({ success: true });

      const orchestrator = new ScfwWorkflowOrchestrator({
        packageSpecs: ["lodash@4.17.21"],
        useNpmFallback: false,
        days: 7,
        scripts: SCRIPTS,
        json: true,
      });

      await orchestrator.execute();

      expect(mockSCFWRunner.install).toHaveBeenCalledWith(["lodash@4.17.21"]);
      expect(mockNpmInstallRunner.install).not.toHaveBeenCalled();
    });
  });

  describe("execute() - human-readable mode", () => {
    it("does not write to stdout in human-readable mode on success", async () => {
      mockSCFWRunner.install.mockReturnValue({ success: true });

      const orchestrator = new ScfwWorkflowOrchestrator({
        packageSpecs: ["lodash@4.17.21"],
        useNpmFallback: false,
        days: 7,
        scripts: SCRIPTS,
        json: false,
      });

      await orchestrator.execute();

      expect(stdoutSpy).not.toHaveBeenCalled();
    });

    it("returns exitCode 0 on success", async () => {
      mockSCFWRunner.install.mockReturnValue({ success: true });

      const orchestrator = new ScfwWorkflowOrchestrator({
        packageSpecs: ["lodash@4.17.21"],
        useNpmFallback: false,
        days: 7,
        scripts: SCRIPTS,
        json: false,
      });

      const result = await orchestrator.execute();

      expect(result.exitCode).toBe(0);
    });

    it("returns exitCode 1 on failure", async () => {
      mockSCFWRunner.install.mockReturnValue({ success: false });

      const orchestrator = new ScfwWorkflowOrchestrator({
        packageSpecs: ["bad@1.0.0"],
        useNpmFallback: false,
        days: 7,
        scripts: SCRIPTS,
        json: false,
      });

      const result = await orchestrator.execute();

      expect(result.exitCode).toBe(1);
    });
  });

  describe("execute() - error handling", () => {
    it("handles thrown errors from SCFWRunner gracefully in JSON mode", async () => {
      mockSCFWRunner.install.mockImplementation(() => {
        throw new Error("SCFW crashed");
      });

      const orchestrator = new ScfwWorkflowOrchestrator({
        packageSpecs: ["pkg@1.0.0"],
        useNpmFallback: false,
        days: 7,
        scripts: SCRIPTS,
        json: true,
      });

      const result = await orchestrator.execute();

      expect(result.exitCode).toBe(1);
      const output = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
      expect(output.success).toBe(false);
      expect(output.error).toContain("SCFW crashed");
    });
  });
});
