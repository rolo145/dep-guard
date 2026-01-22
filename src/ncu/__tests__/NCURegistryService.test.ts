import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockSpinner = {
  start: vi.fn().mockReturnThis(),
  stop: vi.fn().mockReturnThis(),
  stopAndPersist: vi.fn().mockReturnThis(),
  text: "",
};

vi.mock("../../logger", () => ({
  logger: {
    spinner: vi.fn(() => mockSpinner),
    progress: vi.fn(),
    newLine: vi.fn(),
  },
}));

import { NCURegistryService } from "../NCURegistryService";
import type { IExecutionContext } from "../../context/IExecutionContext";

describe("NCURegistryService", () => {
  let service: NCURegistryService;
  let mockContext: IExecutionContext;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock context
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);

    mockContext = {
      cutoff: cutoffDate,
      cutoffIso: cutoffDate.toISOString(),
      days: 7,
      allDependencies: {
        lodash: "^4.17.0",
        express: "^4.18.0",
      },
      dependencies: {},
      devDependencies: {},
      scripts: {},
      scriptNames: { lint: "lint", typecheck: "typecheck", test: "test", build: "build" },
      raw: {},
      hasScript: vi.fn(),
      hasPackage: vi.fn(),
      getPackageVersion: vi.fn(),
    };

    service = new NCURegistryService(mockContext);

    // Mock global fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("filterUpdatesByAge()", () => {
    it("returns empty object for empty updates", async () => {
      const result = await service.filterUpdatesByAge({});

      expect(result).toStrictEqual({});
    });

    it("includes package when safe version is available", async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 14);

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            versions: { "5.0.0": {} },
            time: { "5.0.0": oldDate.toISOString() },
          }),
      });

      const result = await service.filterUpdatesByAge({ lodash: "5.0.0" });

      expect(result).toStrictEqual({ lodash: "5.0.0" });
    });

    it("excludes package when no safe version found", async () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 1);

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            versions: { "5.0.0": {} },
            time: { "5.0.0": recentDate.toISOString() },
          }),
      });

      const result = await service.filterUpdatesByAge({ lodash: "5.0.0" });

      expect(result).toStrictEqual({});
    });

    it("excludes prerelease versions", async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 14);

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            versions: { "5.0.0-beta.1": {}, "4.18.0": {} },
            time: {
              "5.0.0-beta.1": oldDate.toISOString(),
              "4.18.0": oldDate.toISOString(),
            },
          }),
      });

      const result = await service.filterUpdatesByAge({ lodash: "5.0.0-beta.1" });

      expect(result).toStrictEqual({ lodash: "4.18.0" });
    });

    it("uses suggested version when fetch fails", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await service.filterUpdatesByAge({ lodash: "5.0.0" });

      expect(result).toStrictEqual({ lodash: "5.0.0" });
    });

    it("uses suggested version when response is malformed", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await service.filterUpdatesByAge({ lodash: "5.0.0" });

      expect(result).toStrictEqual({ lodash: "5.0.0" });
    });

    it("skips package when safe version matches current", async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 14);

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            versions: { "4.17.0": {} },
            time: { "4.17.0": oldDate.toISOString() },
          }),
      });

      const result = await service.filterUpdatesByAge({ lodash: "5.0.0" });

      expect(result).toStrictEqual({});
    });

    it("handles scoped packages", async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 14);

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            versions: { "3.0.0": {} },
            time: { "3.0.0": oldDate.toISOString() },
          }),
      });

      mockContext.allDependencies["@vue/reactivity"] = "^2.0.0";

      const result = await service.filterUpdatesByAge({ "@vue/reactivity": "3.0.0" });

      expect(result).toStrictEqual({ "@vue/reactivity": "3.0.0" });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("@vue%2Freactivity"),
        expect.any(Object)
      );
    });

    it("returns older safe version when latest is too new", async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 14);
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 1);

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            versions: { "5.0.0": {}, "4.19.0": {} },
            time: {
              "5.0.0": recentDate.toISOString(),
              "4.19.0": oldDate.toISOString(),
            },
          }),
      });

      const result = await service.filterUpdatesByAge({ lodash: "5.0.0" });

      expect(result).toStrictEqual({ lodash: "4.19.0" });
    });

    it("processes multiple packages", async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 14);

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            versions: { "5.0.0": {} },
            time: { "5.0.0": oldDate.toISOString() },
          }),
      });

      const result = await service.filterUpdatesByAge({
        lodash: "5.0.0",
        express: "5.0.0",
      });

      expect(Object.keys(result)).toHaveLength(2);
    });

    it("stops spinner after processing", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            versions: {},
            time: {},
          }),
      });

      await service.filterUpdatesByAge({ lodash: "5.0.0" });

      expect(mockSpinner.stop).toHaveBeenCalled();
    });
  });
});
