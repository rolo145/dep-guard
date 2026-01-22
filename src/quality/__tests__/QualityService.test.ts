import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRunner = {
  runAll: vi.fn(),
  runLint: vi.fn(),
  runTypeCheck: vi.fn(),
  runTests: vi.fn(),
  runBuild: vi.fn(),
};

const mockConfirmation = {
  showSummary: vi.fn(),
};

vi.mock("../QualityRunner", () => ({
  QualityRunner: class {
    runAll = mockRunner.runAll;
    runLint = mockRunner.runLint;
    runTypeCheck = mockRunner.runTypeCheck;
    runTests = mockRunner.runTests;
    runBuild = mockRunner.runBuild;
  },
}));

vi.mock("../QualityConfirmation", () => ({
  QualityConfirmation: class {
    showSummary = mockConfirmation.showSummary;
  },
}));

import { QualityService } from "../QualityService";
import type { IExecutionContext } from "../../context/IExecutionContext";

describe("QualityService", () => {
  let service: QualityService;
  let mockContext: IExecutionContext;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
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

    service = new QualityService(mockContext);
  });

  describe("runAll()", () => {
    it("runs all quality checks via runner", async () => {
      const results = { lint: true, typeCheck: true, tests: true };
      mockRunner.runAll.mockResolvedValue(results);

      await service.runAll();

      expect(mockRunner.runAll).toHaveBeenCalled();
    });

    it("shows summary after running checks", async () => {
      const results = { lint: true, typeCheck: true, tests: true };
      mockRunner.runAll.mockResolvedValue(results);

      await service.runAll();

      expect(mockConfirmation.showSummary).toHaveBeenCalledWith(results);
    });

    it("returns results from runner", async () => {
      const results = { lint: true, typeCheck: false, tests: null };
      mockRunner.runAll.mockResolvedValue(results);

      const result = await service.runAll();

      expect(result).toStrictEqual(results);
    });
  });

  describe("runLint()", () => {
    it("delegates to runner", async () => {
      mockRunner.runLint.mockResolvedValue(true);

      await service.runLint();

      expect(mockRunner.runLint).toHaveBeenCalled();
    });

    it("returns result from runner", async () => {
      mockRunner.runLint.mockResolvedValue(false);

      const result = await service.runLint();

      expect(result).toBeFalsy();
    });
  });

  describe("runTypeCheck()", () => {
    it("delegates to runner", async () => {
      mockRunner.runTypeCheck.mockResolvedValue(true);

      await service.runTypeCheck();

      expect(mockRunner.runTypeCheck).toHaveBeenCalled();
    });

    it("returns result from runner", async () => {
      mockRunner.runTypeCheck.mockResolvedValue(null);

      const result = await service.runTypeCheck();

      expect(result).toBeNull();
    });
  });

  describe("runTests()", () => {
    it("delegates to runner", async () => {
      mockRunner.runTests.mockResolvedValue(true);

      await service.runTests();

      expect(mockRunner.runTests).toHaveBeenCalled();
    });

    it("returns result from runner", async () => {
      mockRunner.runTests.mockResolvedValue(true);

      const result = await service.runTests();

      expect(result).toBeTruthy();
    });
  });

  describe("runBuild()", () => {
    it("delegates to runner", async () => {
      mockRunner.runBuild.mockResolvedValue(true);

      await service.runBuild();

      expect(mockRunner.runBuild).toHaveBeenCalled();
    });

    it("returns result from runner", async () => {
      mockRunner.runBuild.mockResolvedValue(false);

      const result = await service.runBuild();

      expect(result).toBeFalsy();
    });
  });
});
