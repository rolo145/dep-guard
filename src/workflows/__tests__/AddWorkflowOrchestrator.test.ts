import { describe, it, expect, vi, beforeEach } from "vitest";
import { AddWorkflowOrchestrator } from "../AddWorkflowOrchestrator";
import type { AddWorkflowOptions } from "../add/types";

// Mock dependencies
vi.mock("../../logger", () => ({
  logger: {
    info: vi.fn(),
    newLine: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../steps/ResolveVersionStep");
vi.mock("../steps/CheckExistingPackageStep");
vi.mock("../steps/AddSecurityValidationStep");
vi.mock("../steps/AddInstallPackageStep");
vi.mock("../../npq");
vi.mock("../../context/ExecutionContextFactory");

import { ResolveVersionStep } from "../steps/ResolveVersionStep";
import { CheckExistingPackageStep } from "../steps/CheckExistingPackageStep";
import { AddSecurityValidationStep } from "../steps/AddSecurityValidationStep";
import { AddInstallPackageStep } from "../steps/AddInstallPackageStep";
import { ExecutionContextFactory } from "../../context/ExecutionContextFactory";

describe("AddWorkflowOrchestrator", () => {
  let options: AddWorkflowOptions;
  let mockResolveStep: any;
  let mockCheckExistingStep: any;
  let mockSecurityStep: any;
  let mockInstallStep: any;

  beforeEach(() => {
    vi.clearAllMocks();

    options = {
      packageSpec: { name: "vue" },
      days: 7,
      scripts: {
        lint: "lint",
        typecheck: "typecheck",
        test: "test",
        build: "build",
      },
      useNpmFallback: false,
      saveDev: false,
    };

    mockResolveStep = {
      execute: vi.fn(),
    };

    mockCheckExistingStep = {
      execute: vi.fn(),
    };

    mockSecurityStep = {
      execute: vi.fn(),
    };

    mockInstallStep = {
      execute: vi.fn(),
    };

    vi.mocked(ResolveVersionStep).mockImplementation(function (this: any) {
      return mockResolveStep;
    } as any);
    vi.mocked(CheckExistingPackageStep).mockImplementation(function (this: any) {
      return mockCheckExistingStep;
    } as any);
    vi.mocked(AddSecurityValidationStep).mockImplementation(function (this: any) {
      return mockSecurityStep;
    } as any);
    vi.mocked(AddInstallPackageStep).mockImplementation(function (this: any) {
      return mockInstallStep;
    } as any);

    vi.mocked(ExecutionContextFactory.create).mockReturnValue({
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
    });
  });

  describe("execute() - successful flow", () => {
    it("completes full workflow successfully", async () => {
      mockResolveStep.execute.mockResolvedValue({
        success: true,
        package: {
          name: "vue",
          version: "3.2.0",
          wasSpecified: false,
          ageInDays: 14,
        },
      });

      mockCheckExistingStep.execute.mockResolvedValue({
        shouldProceed: true,
        package: {
          name: "vue",
          version: "3.2.0",
          wasSpecified: false,
          ageInDays: 14,
          saveDev: false,
          existing: { exists: false },
        },
      });

      mockSecurityStep.execute.mockResolvedValue({
        confirmed: true,
        package: {
          name: "vue",
          version: "3.2.0",
          wasSpecified: false,
          ageInDays: 14,
          saveDev: false,
          existing: { exists: false },
          npqPassed: true,
          userConfirmed: true,
        },
      });

      mockInstallStep.execute.mockResolvedValue({
        success: true,
        package: {
          name: "vue",
          version: "3.2.0",
          wasSpecified: false,
          ageInDays: 14,
          saveDev: false,
          existing: { exists: false },
          npqPassed: true,
          userConfirmed: true,
          installSuccess: true,
        },
      });

      const orchestrator = new AddWorkflowOrchestrator(options);
      const result = await orchestrator.execute();

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.package).toBeDefined();
    });

    it("adds package as dev dependency when saveDev is true", async () => {
      options.saveDev = true;
      options.packageSpec = { name: "typescript", version: "5.0.0" };

      mockResolveStep.execute.mockResolvedValue({
        success: true,
        package: {
          name: "typescript",
          version: "5.0.0",
          wasSpecified: true,
          ageInDays: 30,
        },
      });

      mockCheckExistingStep.execute.mockResolvedValue({
        shouldProceed: true,
        package: {
          name: "typescript",
          version: "5.0.0",
          wasSpecified: true,
          ageInDays: 30,
          saveDev: true,
          existing: { exists: false },
        },
      });

      mockSecurityStep.execute.mockResolvedValue({
        confirmed: true,
        package: {
          name: "typescript",
          version: "5.0.0",
          wasSpecified: true,
          ageInDays: 30,
          saveDev: true,
          existing: { exists: false },
          npqPassed: true,
          userConfirmed: true,
        },
      });

      mockInstallStep.execute.mockResolvedValue({
        success: true,
        package: {
          name: "typescript",
          version: "5.0.0",
          wasSpecified: true,
          ageInDays: 30,
          saveDev: true,
          existing: { exists: false },
          npqPassed: true,
          userConfirmed: true,
          installSuccess: true,
        },
      });

      const orchestrator = new AddWorkflowOrchestrator(options);
      const result = await orchestrator.execute();

      expect(result.success).toBe(true);
      expect(mockCheckExistingStep.execute).toHaveBeenCalledWith(expect.anything(), true);
    });
  });

  describe("execute() - version resolution failure", () => {
    it("exits when version resolution fails", async () => {
      mockResolveStep.execute.mockResolvedValue({
        success: false,
        errorMessage: "No safe version found",
      });

      const orchestrator = new AddWorkflowOrchestrator(options);
      const result = await orchestrator.execute();

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.errorMessage).toContain("No safe version found");
      expect(mockCheckExistingStep.execute).not.toHaveBeenCalled();
    });
  });

  describe("execute() - existing package check cancellation", () => {
    it("exits when user chooses not to proceed with existing package", async () => {
      mockResolveStep.execute.mockResolvedValue({
        success: true,
        package: {
          name: "vue",
          version: "3.2.0",
          wasSpecified: false,
          ageInDays: 14,
        },
      });

      mockCheckExistingStep.execute.mockResolvedValue({
        shouldProceed: false,
        cancelReason: "User chose to keep current version",
      });

      const orchestrator = new AddWorkflowOrchestrator(options);
      const result = await orchestrator.execute();

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(0);
      expect(result.errorMessage).toContain("keep current version");
      expect(mockSecurityStep.execute).not.toHaveBeenCalled();
    });
  });

  describe("execute() - security validation failure", () => {
    it("exits when user does not confirm after security check", async () => {
      mockResolveStep.execute.mockResolvedValue({
        success: true,
        package: {
          name: "vue",
          version: "3.2.0",
          wasSpecified: false,
          ageInDays: 14,
        },
      });

      mockCheckExistingStep.execute.mockResolvedValue({
        shouldProceed: true,
        package: {
          name: "vue",
          version: "3.2.0",
          wasSpecified: false,
          ageInDays: 14,
          saveDev: false,
          existing: { exists: false },
        },
      });

      mockSecurityStep.execute.mockResolvedValue({
        confirmed: false,
        cancelReason: "User did not confirm installation",
      });

      const orchestrator = new AddWorkflowOrchestrator(options);
      const result = await orchestrator.execute();

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(0);
      expect(result.errorMessage).toContain("did not confirm");
      expect(mockInstallStep.execute).not.toHaveBeenCalled();
    });
  });

  describe("execute() - installation failure", () => {
    it("exits when installation fails", async () => {
      mockResolveStep.execute.mockResolvedValue({
        success: true,
        package: {
          name: "vue",
          version: "3.2.0",
          wasSpecified: false,
          ageInDays: 14,
        },
      });

      mockCheckExistingStep.execute.mockResolvedValue({
        shouldProceed: true,
        package: {
          name: "vue",
          version: "3.2.0",
          wasSpecified: false,
          ageInDays: 14,
          saveDev: false,
          existing: { exists: false },
        },
      });

      mockSecurityStep.execute.mockResolvedValue({
        confirmed: true,
        package: {
          name: "vue",
          version: "3.2.0",
          wasSpecified: false,
          ageInDays: 14,
          saveDev: false,
          existing: { exists: false },
          npqPassed: true,
          userConfirmed: true,
        },
      });

      mockInstallStep.execute.mockResolvedValue({
        success: false,
        errorMessage: "Installation failed",
      });

      const orchestrator = new AddWorkflowOrchestrator(options);
      const result = await orchestrator.execute();

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.errorMessage).toContain("Installation failed");
    });
  });

  describe("execute() - scoped packages", () => {
    it("handles scoped packages correctly", async () => {
      options.packageSpec = { name: "@vue/cli", version: "5.0.0" };

      mockResolveStep.execute.mockResolvedValue({
        success: true,
        package: {
          name: "@vue/cli",
          version: "5.0.0",
          wasSpecified: true,
          ageInDays: 30,
        },
      });

      mockCheckExistingStep.execute.mockResolvedValue({
        shouldProceed: true,
        package: {
          name: "@vue/cli",
          version: "5.0.0",
          wasSpecified: true,
          ageInDays: 30,
          saveDev: false,
          existing: { exists: false },
        },
      });

      mockSecurityStep.execute.mockResolvedValue({
        confirmed: true,
        package: {
          name: "@vue/cli",
          version: "5.0.0",
          wasSpecified: true,
          ageInDays: 30,
          saveDev: false,
          existing: { exists: false },
          npqPassed: true,
          userConfirmed: true,
        },
      });

      mockInstallStep.execute.mockResolvedValue({
        success: true,
        package: {
          name: "@vue/cli",
          version: "5.0.0",
          wasSpecified: true,
          ageInDays: 30,
          saveDev: false,
          existing: { exists: false },
          npqPassed: true,
          userConfirmed: true,
          installSuccess: true,
        },
      });

      const orchestrator = new AddWorkflowOrchestrator(options);
      const result = await orchestrator.execute();

      expect(result.success).toBe(true);
      expect(result.package?.name).toBe("@vue/cli");
    });
  });
});
