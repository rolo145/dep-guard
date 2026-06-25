import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import spawn from "cross-spawn";
import { PrerequisiteValidator } from "../PrerequisiteValidator";

// Mock cross-spawn (used to spawn the prerequisite checks cross-platform)
vi.mock("cross-spawn", () => ({
  default: { sync: vi.fn() },
}));

const spawnSync = spawn.sync;

// Mock logger to avoid console output during tests
vi.mock("../../logger", () => ({
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
    it("returns scfwAvailable: true when scfw is available", () => {
      vi.mocked(spawnSync).mockReturnValue({ status: 0 } as ReturnType<typeof spawnSync>);

      const result = PrerequisiteValidator.checkPrerequisites();

      expect(result).toStrictEqual({ scfwAvailable: true, useNpmFallback: false });
      expect(mockExit).not.toHaveBeenCalled();
    });

    it("checks scfw command with --version flag", () => {
      vi.mocked(spawnSync).mockReturnValue({ status: 0 } as ReturnType<typeof spawnSync>);

      PrerequisiteValidator.checkPrerequisites();

      expect(spawnSync).toHaveBeenCalledWith("scfw", ["--version"], {
        stdio: "ignore",
      });
    });

    it("throws PrerequisiteError when scfw is not available and allowNpmInstall is false", () => {
      vi.mocked(spawnSync).mockReturnValue({ status: 1 } as ReturnType<typeof spawnSync>);

      expect(() => PrerequisiteValidator.checkPrerequisites()).toThrow(
        "scfw is not installed and --allow-npm-install was not specified"
      );
    });

    it("throws PrerequisiteError when scfw command returns null status", () => {
      vi.mocked(spawnSync).mockReturnValue({ status: null } as ReturnType<typeof spawnSync>);

      expect(() => PrerequisiteValidator.checkPrerequisites()).toThrow(
        "scfw is not installed and --allow-npm-install was not specified"
      );
    });
  });

  describe("checkPrerequisites() with allowNpmInstall", () => {
    it("returns useNpmFallback: true when scfw is not available and allowNpmInstall is true", () => {
      vi.mocked(spawnSync).mockReturnValue({ status: 1 } as ReturnType<typeof spawnSync>);

      const result = PrerequisiteValidator.checkPrerequisites(true);

      expect(result).toStrictEqual({ scfwAvailable: false, useNpmFallback: true });
      expect(mockExit).not.toHaveBeenCalled();
    });

    it("throws PrerequisiteError when scfw IS available and allowNpmInstall is true", () => {
      vi.mocked(spawnSync).mockReturnValue({ status: 0 } as ReturnType<typeof spawnSync>);

      expect(() => PrerequisiteValidator.checkPrerequisites(true)).toThrow(
        "--allow-npm-install flag is invalid when scfw is available"
      );
    });

    it("returns scfwAvailable: true when scfw is available and allowNpmInstall is false", () => {
      vi.mocked(spawnSync).mockReturnValue({ status: 0 } as ReturnType<typeof spawnSync>);

      const result = PrerequisiteValidator.checkPrerequisites(false);

      expect(result).toStrictEqual({ scfwAvailable: true, useNpmFallback: false });
      expect(mockExit).not.toHaveBeenCalled();
    });
  });
});
