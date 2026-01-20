import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Store original process.argv
const originalArgv = process.argv;

// Mock dependencies at module level
vi.mock("../workflows", () => ({
  WorkflowOrchestrator: class MockOrchestrator {
    constructor() {}
    async execute() {
      return { exitCode: 0 };
    }
  },
}));

vi.mock("../quality/ScriptValidator", () => ({
  ScriptValidator: {
    validate: vi.fn(),
  },
}));

vi.mock("../args", () => ({
  ArgumentParser: class MockParser {
    constructor() {}
    hasFlag(long: string, short?: string) {
      const args = process.argv.slice(2);
      return args.includes(long) || (short && args.includes(short));
    }
    parseOrExit() {
      return {
        days: 7,
        scripts: { lint: "lint", typecheck: "typecheck", test: "test", build: "build" },
        allowNpmInstall: false,
      };
    }
  },
  CLIHelper: {
    showHelp: vi.fn(),
    getVersion: vi.fn().mockReturnValue("1.0.0"),
  },
  PrerequisiteValidator: {
    checkPrerequisites: vi.fn().mockReturnValue({ scfwAvailable: true, useNpmFallback: false }),
  },
}));

vi.mock("../errors", () => ({
  EXIT_CODE_CANCELLED: 130,
  handleFatalError: vi.fn(),
}));

describe("index.ts (CLI entry point)", () => {
  let mockExit: ReturnType<typeof vi.spyOn>;
  let mockConsoleLog: ReturnType<typeof vi.spyOn>;
  let signalHandlers: Record<string, Function>;

  beforeEach(() => {
    vi.clearAllMocks();
    signalHandlers = {};

    mockExit = vi.spyOn(process, "exit").mockImplementation((() => {
      // Don't actually exit
    }) as any);

    mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

    vi.spyOn(process, "on").mockImplementation(((signal: string, handler: Function) => {
      signalHandlers[signal] = handler;
      return process;
    }) as any);

    // Reset argv
    process.argv = ["node", "index.js"];
  });

  afterEach(() => {
    mockExit.mockRestore();
    mockConsoleLog.mockRestore();
    process.argv = originalArgv;
    vi.restoreAllMocks();
  });

  describe("signal handlers", () => {
    it("registers SIGINT and SIGTERM handlers on import", async () => {
      vi.resetModules();
      await import("../index").catch(() => {});

      expect(signalHandlers["SIGINT"]).toBeDefined();
      expect(signalHandlers["SIGTERM"]).toBeDefined();
    });

    it("SIGINT handler logs shutdown message and exits with 130", async () => {
      vi.resetModules();
      await import("../index").catch(() => {});

      // Trigger SIGINT handler
      signalHandlers["SIGINT"]?.("SIGINT");

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Received SIGINT")
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "No changes were made to your dependencies."
      );
      expect(mockExit).toHaveBeenCalledWith(130);
    });

    it("SIGTERM handler logs shutdown message and exits with 130", async () => {
      vi.resetModules();
      await import("../index").catch(() => {});

      // Trigger SIGTERM handler
      signalHandlers["SIGTERM"]?.("SIGTERM");

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Received SIGTERM")
      );
      expect(mockExit).toHaveBeenCalledWith(130);
    });
  });

  describe("--help flag", () => {
    it("shows help and exits with code 0", async () => {
      process.argv = ["node", "index.js", "--help"];
      vi.resetModules();

      const { CLIHelper } = await import("../args");
      await import("../index").catch(() => {});

      expect(CLIHelper.showHelp).toHaveBeenCalled();
      expect(mockExit).toHaveBeenCalledWith(0);
    });

    it("handles -h short flag", async () => {
      process.argv = ["node", "index.js", "-h"];
      vi.resetModules();

      const { CLIHelper } = await import("../args");
      await import("../index").catch(() => {});

      expect(CLIHelper.showHelp).toHaveBeenCalled();
      expect(mockExit).toHaveBeenCalledWith(0);
    });
  });

  describe("--version flag", () => {
    it("shows version and exits with code 0", async () => {
      process.argv = ["node", "index.js", "--version"];
      vi.resetModules();

      await import("../index").catch(() => {});

      expect(mockConsoleLog).toHaveBeenCalledWith("dep-guard v1.0.0");
      expect(mockExit).toHaveBeenCalledWith(0);
    });

    it("handles -v short flag", async () => {
      process.argv = ["node", "index.js", "-v"];
      vi.resetModules();

      await import("../index").catch(() => {});

      expect(mockConsoleLog).toHaveBeenCalledWith("dep-guard v1.0.0");
      expect(mockExit).toHaveBeenCalledWith(0);
    });
  });

  describe("normal execution flow", () => {
    it("checks prerequisites", async () => {
      vi.resetModules();

      const { PrerequisiteValidator } = await import("../args");
      await import("../index").catch(() => {});

      // Wait for async execution
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(PrerequisiteValidator.checkPrerequisites).toHaveBeenCalled();
    });

    it("validates scripts", async () => {
      vi.resetModules();

      const { ScriptValidator } = await import("../quality/ScriptValidator");
      await import("../index").catch(() => {});

      // Wait for async execution
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(ScriptValidator.validate).toHaveBeenCalled();
    });

    it("exits with workflow exit code on success", async () => {
      vi.resetModules();
      await import("../index").catch(() => {});

      // Wait for async execution
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockExit).toHaveBeenCalledWith(0);
    });
  });
});
