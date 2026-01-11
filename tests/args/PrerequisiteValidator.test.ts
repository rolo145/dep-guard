import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { spawnSync } from "child_process";
import { PrerequisiteValidator } from "../../src/args/PrerequisiteValidator";

// Mock child_process
vi.mock("child_process", () => ({
  spawnSync: vi.fn(),
}));

// Mock logger to avoid console output during tests
vi.mock("../../src/logger", () => ({
  logger: {
    header: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    progress: vi.fn(),
    info: vi.fn(),
    newLine: vi.fn(),
  },
}));

describe("PrerequisiteValidator", () => {
  let mockExit: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExit = vi.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("checkPrerequisites()", () => {
    it("does not exit when scfw is available", () => {
      vi.mocked(spawnSync).mockReturnValue({ status: 0 } as ReturnType<typeof spawnSync>);

      expect(() => PrerequisiteValidator.checkPrerequisites()).not.toThrow();
      expect(mockExit).not.toHaveBeenCalled();
    });

    it("checks scfw command with --version flag", () => {
      vi.mocked(spawnSync).mockReturnValue({ status: 0 } as ReturnType<typeof spawnSync>);

      PrerequisiteValidator.checkPrerequisites();

      expect(spawnSync).toHaveBeenCalledWith("scfw", ["--version"], {
        stdio: "ignore",
        shell: false,
      });
    });

    it("exits with code 1 when scfw is not available", () => {
      vi.mocked(spawnSync).mockReturnValue({ status: 1 } as ReturnType<typeof spawnSync>);

      expect(() => PrerequisiteValidator.checkPrerequisites()).toThrow();
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it("exits when scfw command returns null status", () => {
      vi.mocked(spawnSync).mockReturnValue({ status: null } as ReturnType<typeof spawnSync>);

      expect(() => PrerequisiteValidator.checkPrerequisites()).toThrow();
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });
});
