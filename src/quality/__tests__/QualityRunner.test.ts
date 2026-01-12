import { describe, it, expect, vi, beforeEach } from "vitest";

const mockLintService = {
  run: vi.fn(),
};

const mockTypeCheckService = {
  run: vi.fn(),
};

const mockTestService = {
  run: vi.fn(),
};

const mockBuildService = {
  run: vi.fn(),
};

vi.mock("../lint/LintService", () => ({
  LintService: class {
    run = mockLintService.run;
  },
}));

vi.mock("../typecheck/TypeCheckService", () => ({
  TypeCheckService: class {
    run = mockTypeCheckService.run;
  },
}));

vi.mock("../test/TestService", () => ({
  TestService: class {
    run = mockTestService.run;
  },
}));

vi.mock("../build/BuildService", () => ({
  BuildService: class {
    run = mockBuildService.run;
  },
}));

import { QualityRunner } from "../QualityRunner";
import type { IExecutionContext } from "../../context/IExecutionContext";

describe("QualityRunner", () => {
  let runner: QualityRunner;
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

    runner = new QualityRunner(mockContext);
  });

  describe("runAll()", () => {
    it("runs lint, typecheck, and test services", async () => {
      mockLintService.run.mockResolvedValue(true);
      mockTypeCheckService.run.mockResolvedValue(true);
      mockTestService.run.mockResolvedValue(true);

      await runner.runAll();

      expect(mockLintService.run).toHaveBeenCalled();
      expect(mockTypeCheckService.run).toHaveBeenCalled();
      expect(mockTestService.run).toHaveBeenCalled();
    });

    it("returns results from all services", async () => {
      mockLintService.run.mockResolvedValue(true);
      mockTypeCheckService.run.mockResolvedValue(false);
      mockTestService.run.mockResolvedValue(null);

      const result = await runner.runAll();

      expect(result).toEqual({
        lint: true,
        typeCheck: false,
        tests: null,
      });
    });

    it("returns all true when all checks pass", async () => {
      mockLintService.run.mockResolvedValue(true);
      mockTypeCheckService.run.mockResolvedValue(true);
      mockTestService.run.mockResolvedValue(true);

      const result = await runner.runAll();

      expect(result).toEqual({
        lint: true,
        typeCheck: true,
        tests: true,
      });
    });

    it("returns all false when all checks fail", async () => {
      mockLintService.run.mockResolvedValue(false);
      mockTypeCheckService.run.mockResolvedValue(false);
      mockTestService.run.mockResolvedValue(false);

      const result = await runner.runAll();

      expect(result).toEqual({
        lint: false,
        typeCheck: false,
        tests: false,
      });
    });

    it("returns all null when all checks are skipped", async () => {
      mockLintService.run.mockResolvedValue(null);
      mockTypeCheckService.run.mockResolvedValue(null);
      mockTestService.run.mockResolvedValue(null);

      const result = await runner.runAll();

      expect(result).toEqual({
        lint: null,
        typeCheck: null,
        tests: null,
      });
    });
  });

  describe("runLint()", () => {
    it("runs lint service", async () => {
      mockLintService.run.mockResolvedValue(true);

      await runner.runLint();

      expect(mockLintService.run).toHaveBeenCalled();
    });

    it("returns true when lint passes", async () => {
      mockLintService.run.mockResolvedValue(true);

      const result = await runner.runLint();

      expect(result).toBeTruthy();
    });

    it("returns false when lint fails", async () => {
      mockLintService.run.mockResolvedValue(false);

      const result = await runner.runLint();

      expect(result).toBeFalsy();
    });

    it("returns null when lint is skipped", async () => {
      mockLintService.run.mockResolvedValue(null);

      const result = await runner.runLint();

      expect(result).toBeNull();
    });
  });

  describe("runTypeCheck()", () => {
    it("runs typecheck service", async () => {
      mockTypeCheckService.run.mockResolvedValue(true);

      await runner.runTypeCheck();

      expect(mockTypeCheckService.run).toHaveBeenCalled();
    });

    it("returns true when typecheck passes", async () => {
      mockTypeCheckService.run.mockResolvedValue(true);

      const result = await runner.runTypeCheck();

      expect(result).toBeTruthy();
    });

    it("returns false when typecheck fails", async () => {
      mockTypeCheckService.run.mockResolvedValue(false);

      const result = await runner.runTypeCheck();

      expect(result).toBeFalsy();
    });

    it("returns null when typecheck is skipped", async () => {
      mockTypeCheckService.run.mockResolvedValue(null);

      const result = await runner.runTypeCheck();

      expect(result).toBeNull();
    });
  });

  describe("runTests()", () => {
    it("runs test service", async () => {
      mockTestService.run.mockResolvedValue(true);

      await runner.runTests();

      expect(mockTestService.run).toHaveBeenCalled();
    });

    it("returns true when tests pass", async () => {
      mockTestService.run.mockResolvedValue(true);

      const result = await runner.runTests();

      expect(result).toBeTruthy();
    });

    it("returns false when tests fail", async () => {
      mockTestService.run.mockResolvedValue(false);

      const result = await runner.runTests();

      expect(result).toBeFalsy();
    });

    it("returns null when tests are skipped", async () => {
      mockTestService.run.mockResolvedValue(null);

      const result = await runner.runTests();

      expect(result).toBeNull();
    });
  });

  describe("runBuild()", () => {
    it("runs build service", async () => {
      mockBuildService.run.mockResolvedValue(true);

      await runner.runBuild();

      expect(mockBuildService.run).toHaveBeenCalled();
    });

    it("returns true when build passes", async () => {
      mockBuildService.run.mockResolvedValue(true);

      const result = await runner.runBuild();

      expect(result).toBeTruthy();
    });

    it("returns false when build fails", async () => {
      mockBuildService.run.mockResolvedValue(false);

      const result = await runner.runBuild();

      expect(result).toBeFalsy();
    });

    it("returns null when build is skipped", async () => {
      mockBuildService.run.mockResolvedValue(null);

      const result = await runner.runBuild();

      expect(result).toBeNull();
    });
  });
});
