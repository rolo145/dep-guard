import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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

const mockNCUService = {
  loadUpdates: vi.fn(),
  showNoUpdates: vi.fn(),
  showPotentialUpdates: vi.fn(),
  filterByAge: vi.fn(),
  showNoSafeUpdates: vi.fn(),
  showSafeUpdates: vi.fn(),
  buildChoices: vi.fn(),
  showGroupSummary: vi.fn(),
  promptSelection: vi.fn(),
};

const mockNPQService = {
  processSelection: vi.fn(),
};

const mockInstallService = {
  installPackages: vi.fn(),
  reinstall: vi.fn(),
};

const mockQualityService = {
  runAll: vi.fn(),
  runBuild: vi.fn(),
};

vi.mock("../../ncu", () => ({
  NCUService: class {
    loadUpdates = mockNCUService.loadUpdates;
    showNoUpdates = mockNCUService.showNoUpdates;
    showPotentialUpdates = mockNCUService.showPotentialUpdates;
    filterByAge = mockNCUService.filterByAge;
    showNoSafeUpdates = mockNCUService.showNoSafeUpdates;
    showSafeUpdates = mockNCUService.showSafeUpdates;
    buildChoices = mockNCUService.buildChoices;
    showGroupSummary = mockNCUService.showGroupSummary;
    promptSelection = mockNCUService.promptSelection;
  },
}));

vi.mock("../../npq", () => ({
  NPQService: class {
    processSelection = mockNPQService.processSelection;
  },
}));

vi.mock("../../install", () => ({
  InstallService: class {
    installPackages = mockInstallService.installPackages;
    reinstall = mockInstallService.reinstall;
  },
}));

vi.mock("../../quality", () => ({
  QualityService: class {
    runAll = mockQualityService.runAll;
    runBuild = mockQualityService.runBuild;
  },
}));

vi.mock("../../logger", () => ({
  logger: {
    step: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
    summaryTable: vi.fn(),
    newLine: vi.fn(),
    header: vi.fn(),
    info: vi.fn(),
    divider: vi.fn(),
  },
}));

vi.mock("../../errors", () => ({
  isUserCancellation: vi.fn(),
  logCancellation: vi.fn(),
  EXIT_CODE_CANCELLED: 130,
}));

import { WorkflowOrchestrator } from "../WorkflowOrchestrator";
import * as errors from "../../errors";
import { logger } from "../../logger";

describe("WorkflowOrchestrator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("execute()", () => {
    it("returns early when no updates available", async () => {
      mockNCUService.loadUpdates.mockResolvedValue({});

      const orchestrator = new WorkflowOrchestrator({
        days: 7,
        scripts: { lint: "lint", typecheck: "typecheck", test: "test", build: "build" },
      });

      const result = await orchestrator.execute();

      expect(result.success).toBeTruthy();
      expect(result.exitCode).toBe(0);
      expect(result.reason).toBe("no_updates_available");
    });

    it("returns early when all updates filtered by safety buffer", async () => {
      mockNCUService.loadUpdates.mockResolvedValue({ lodash: "5.0.0" });
      mockNCUService.filterByAge.mockResolvedValue({});

      const orchestrator = new WorkflowOrchestrator({
        days: 7,
        scripts: { lint: "lint", typecheck: "typecheck", test: "test", build: "build" },
      });

      const result = await orchestrator.execute();

      expect(result.success).toBeTruthy();
      expect(result.exitCode).toBe(0);
      expect(result.reason).toBe("all_updates_filtered");
    });

    it("returns early when no packages selected", async () => {
      mockNCUService.loadUpdates.mockResolvedValue({ lodash: "5.0.0" });
      mockNCUService.filterByAge.mockResolvedValue({ lodash: "5.0.0" });
      mockNCUService.buildChoices.mockReturnValue({ grouped: {}, choices: [] });
      mockNCUService.promptSelection.mockResolvedValue([]);

      const orchestrator = new WorkflowOrchestrator({
        days: 7,
        scripts: { lint: "lint", typecheck: "typecheck", test: "test", build: "build" },
      });

      const result = await orchestrator.execute();

      expect(result.success).toBeTruthy();
      expect(result.exitCode).toBe(0);
      expect(result.reason).toBe("no_packages_selected");
    });

    it("returns early when no packages confirmed after security", async () => {
      mockNCUService.loadUpdates.mockResolvedValue({ lodash: "5.0.0" });
      mockNCUService.filterByAge.mockResolvedValue({ lodash: "5.0.0" });
      mockNCUService.buildChoices.mockReturnValue({ grouped: {}, choices: [] });
      mockNCUService.promptSelection.mockResolvedValue([{ name: "lodash", version: "5.0.0" }]);
      mockNPQService.processSelection.mockResolvedValue([]);

      const orchestrator = new WorkflowOrchestrator({
        days: 7,
        scripts: { lint: "lint", typecheck: "typecheck", test: "test", build: "build" },
      });

      const result = await orchestrator.execute();

      expect(result.success).toBeTruthy();
      expect(result.exitCode).toBe(0);
      expect(result.reason).toBe("no_packages_confirmed");
    });

    it("completes successfully with all steps", async () => {
      const packages = [{ name: "lodash", version: "5.0.0" }];

      mockNCUService.loadUpdates.mockResolvedValue({ lodash: "5.0.0" });
      mockNCUService.filterByAge.mockResolvedValue({ lodash: "5.0.0" });
      mockNCUService.buildChoices.mockReturnValue({ grouped: {}, choices: [] });
      mockNCUService.promptSelection.mockResolvedValue(packages);
      mockNPQService.processSelection.mockResolvedValue(packages);
      mockInstallService.installPackages.mockResolvedValue(undefined);
      mockInstallService.reinstall.mockResolvedValue(undefined);
      mockQualityService.runAll.mockResolvedValue({});
      mockQualityService.runBuild.mockResolvedValue(true);

      const orchestrator = new WorkflowOrchestrator({
        days: 7,
        scripts: { lint: "lint", typecheck: "typecheck", test: "test", build: "build" },
      });

      const result = await orchestrator.execute();

      expect(result.success).toBeTruthy();
      expect(result.exitCode).toBe(0);
      expect(result.reason).toBe("completed");
      expect(result.stats?.packagesInstalled).toBe(1);
    });

    it("handles user cancellation gracefully", async () => {
      const cancellationError = new Error("User cancelled");
      mockNCUService.loadUpdates.mockRejectedValue(cancellationError);
      vi.mocked(errors.isUserCancellation).mockReturnValue(true);

      const orchestrator = new WorkflowOrchestrator({
        days: 7,
        scripts: { lint: "lint", typecheck: "typecheck", test: "test", build: "build" },
      });

      const result = await orchestrator.execute();

      expect(result.success).toBeFalsy();
      expect(result.exitCode).toBe(130);
      expect(result.reason).toBe("user_cancelled");
    });

    it("re-throws non-cancellation errors", async () => {
      const unexpectedError = new Error("Unexpected error");
      mockNCUService.loadUpdates.mockRejectedValue(unexpectedError);
      vi.mocked(errors.isUserCancellation).mockReturnValue(false);

      const orchestrator = new WorkflowOrchestrator({
        days: 7,
        scripts: { lint: "lint", typecheck: "typecheck", test: "test", build: "build" },
      });

      await expect(orchestrator.execute()).rejects.toThrow("Unexpected error");
    });

    it("tracks statistics throughout workflow", async () => {
      const packages = [
        { name: "lodash", version: "5.0.0" },
        { name: "express", version: "4.19.0" },
      ];

      mockNCUService.loadUpdates.mockResolvedValue({
        lodash: "5.0.0",
        express: "4.19.0",
        axios: "1.6.0",
      });
      mockNCUService.filterByAge.mockResolvedValue({ lodash: "5.0.0", express: "4.19.0" });
      mockNCUService.buildChoices.mockReturnValue({ grouped: {}, choices: [] });
      mockNCUService.promptSelection.mockResolvedValue(packages);
      mockNPQService.processSelection.mockResolvedValue(packages);
      mockInstallService.installPackages.mockResolvedValue(undefined);
      mockInstallService.reinstall.mockResolvedValue(undefined);
      mockQualityService.runAll.mockResolvedValue({});
      mockQualityService.runBuild.mockResolvedValue(true);

      const orchestrator = new WorkflowOrchestrator({
        days: 7,
        scripts: { lint: "lint", typecheck: "typecheck", test: "test", build: "build" },
      });

      const result = await orchestrator.execute();

      expect(result.stats?.packagesFound).toBe(3);
      expect(result.stats?.packagesAfterFilter).toBe(2);
      expect(result.stats?.packagesSelected).toBe(2);
      expect(result.stats?.packagesInstalled).toBe(2);
    });
  });

  describe("execute() with show mode", () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      // Mock console.log to prevent stdout output during tests
      consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    it("returns after organizing updates when show mode is enabled", async () => {
      const grouped = {
        major: [{ name: "axios", currentVersion: "0.27.2", newVersion: "1.4.0" }],
        minor: [
          { name: "vite", currentVersion: "4.3.9", newVersion: "4.4.2" },
          { name: "vue", currentVersion: "3.3.4", newVersion: "3.3.5" },
        ],
        patch: [{ name: "eslint", currentVersion: "8.45.0", newVersion: "8.45.2" }],
      };

      mockNCUService.loadUpdates.mockResolvedValue({
        axios: "1.4.0",
        vite: "4.4.2",
        vue: "3.3.5",
        eslint: "8.45.2",
      });
      mockNCUService.filterByAge.mockResolvedValue({
        axios: "1.4.0",
        vite: "4.4.2",
        vue: "3.3.5",
        eslint: "8.45.2",
      });
      mockNCUService.buildChoices.mockReturnValue({ grouped, choices: [] });

      const orchestrator = new WorkflowOrchestrator({
        days: 7,
        scripts: { lint: "lint", typecheck: "typecheck", test: "test", build: "build" },
        show: true,
      });

      const result = await orchestrator.execute();

      expect(result.success).toBeTruthy();
      expect(result.exitCode).toBe(0);
      expect(result.reason).toBe("completed");

      // Verify logger methods were called for display
      expect(logger.header).toHaveBeenCalledWith("Available Updates", "📋");
      expect(logger.summaryTable).toHaveBeenCalledWith("UPDATE SUMMARY", expect.any(Object));
      expect(logger.info).toHaveBeenCalledWith(
        "Run 'dep-guard update' without --show to install these updates"
      );

      // Verify no installation steps were called
      expect(mockNCUService.promptSelection).not.toHaveBeenCalled();
      expect(mockNPQService.processSelection).not.toHaveBeenCalled();
      expect(mockInstallService.installPackages).not.toHaveBeenCalled();
      expect(mockInstallService.reinstall).not.toHaveBeenCalled();
      expect(mockQualityService.runAll).not.toHaveBeenCalled();
      expect(mockQualityService.runBuild).not.toHaveBeenCalled();
    });

    it("displays correct summary statistics in show mode", async () => {
      const grouped = {
        major: [{ name: "axios", currentVersion: "0.27.2", newVersion: "1.4.0" }],
        minor: [
          { name: "vite", currentVersion: "4.3.9", newVersion: "4.4.2" },
          { name: "vue", currentVersion: "3.3.4", newVersion: "3.3.5" },
        ],
        patch: [{ name: "eslint", currentVersion: "8.45.0", newVersion: "8.45.2" }],
      };

      mockNCUService.loadUpdates.mockResolvedValue({
        axios: "1.4.0",
        vite: "4.4.2",
        vue: "3.3.5",
        eslint: "8.45.2",
      });
      mockNCUService.filterByAge.mockResolvedValue({
        axios: "1.4.0",
        vite: "4.4.2",
        vue: "3.3.5",
        eslint: "8.45.2",
      });
      mockNCUService.buildChoices.mockReturnValue({ grouped, choices: [] });

      const orchestrator = new WorkflowOrchestrator({
        days: 14,
        scripts: { lint: "lint", typecheck: "typecheck", test: "test", build: "build" },
        show: true,
      });

      await orchestrator.execute();

      expect(logger.summaryTable).toHaveBeenCalledWith("UPDATE SUMMARY", {
        "Total updates available": 4,
        "Patch updates": 1,
        "Minor updates": 2,
        "Major updates": 1,
        "Safety buffer applied": "14 days",
      });
    });

    it("exits early when no updates available even with show mode enabled", async () => {
      mockNCUService.loadUpdates.mockResolvedValue({});

      const orchestrator = new WorkflowOrchestrator({
        days: 7,
        scripts: { lint: "lint", typecheck: "typecheck", test: "test", build: "build" },
        show: true,
      });

      const result = await orchestrator.execute();

      expect(result.success).toBeTruthy();
      expect(result.exitCode).toBe(0);
      expect(result.reason).toBe("no_updates_available");

      // Verify show mode display was not called (because we exited early)
      expect(logger.header).not.toHaveBeenCalledWith("Available Updates", "📋");
    });

    it("respects custom safety buffer in show mode", async () => {
      const grouped = {
        major: [],
        minor: [{ name: "vite", currentVersion: "4.3.9", newVersion: "4.4.2" }],
        patch: [],
      };

      mockNCUService.loadUpdates.mockResolvedValue({ vite: "4.4.2" });
      mockNCUService.filterByAge.mockResolvedValue({ vite: "4.4.2" });
      mockNCUService.buildChoices.mockReturnValue({ grouped, choices: [] });

      const orchestrator = new WorkflowOrchestrator({
        days: 30,
        scripts: { lint: "lint", typecheck: "typecheck", test: "test", build: "build" },
        show: true,
      });

      await orchestrator.execute();

      expect(logger.summaryTable).toHaveBeenCalledWith("UPDATE SUMMARY", {
        "Total updates available": 1,
        "Patch updates": 0,
        "Minor updates": 1,
        "Major updates": 0,
        "Safety buffer applied": "30 days",
      });
    });

    it("executes normally without show flag", async () => {
      const packages = [{ name: "lodash", version: "5.0.0" }];

      mockNCUService.loadUpdates.mockResolvedValue({ lodash: "5.0.0" });
      mockNCUService.filterByAge.mockResolvedValue({ lodash: "5.0.0" });
      mockNCUService.buildChoices.mockReturnValue({ grouped: {}, choices: [] });
      mockNCUService.promptSelection.mockResolvedValue(packages);
      mockNPQService.processSelection.mockResolvedValue(packages);
      mockInstallService.installPackages.mockResolvedValue(undefined);
      mockInstallService.reinstall.mockResolvedValue(undefined);
      mockQualityService.runAll.mockResolvedValue({});
      mockQualityService.runBuild.mockResolvedValue(true);

      const orchestrator = new WorkflowOrchestrator({
        days: 7,
        scripts: { lint: "lint", typecheck: "typecheck", test: "test", build: "build" },
        show: false,
      });

      const result = await orchestrator.execute();

      expect(result.success).toBeTruthy();
      expect(result.exitCode).toBe(0);
      expect(result.reason).toBe("completed");

      // Verify all installation steps were called
      expect(mockNCUService.promptSelection).toHaveBeenCalled();
      expect(mockNPQService.processSelection).toHaveBeenCalled();
      expect(mockInstallService.installPackages).toHaveBeenCalled();
      expect(mockInstallService.reinstall).toHaveBeenCalled();
      expect(mockQualityService.runAll).toHaveBeenCalled();
      expect(mockQualityService.runBuild).toHaveBeenCalled();

      // Verify show mode display was not called
      expect(logger.header).not.toHaveBeenCalledWith("Available Updates", "📋");
    });
  });
});
