import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PackageResolverService } from "../PackageResolverService";
import type { IExecutionContext } from "../../context/IExecutionContext";
import { RegistryFetchError, RegistryParseError } from "../errors";

describe("PackageResolverService", () => {
  let service: PackageResolverService;
  let mockContext: IExecutionContext;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock context with 7-day safety buffer
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);

    mockContext = {
      cutoff: cutoffDate,
      cutoffIso: cutoffDate.toISOString(),
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

    service = new PackageResolverService(mockContext);

    // Mock global fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("resolveLatestSafeVersion()", () => {
    it("returns latest stable version that meets safety buffer", async () => {
      const newestOldDate = new Date();
      newestOldDate.setDate(newestOldDate.getDate() - 14);

      const olderDate = new Date();
      olderDate.setDate(olderDate.getDate() - 20);

      const veryOldDate = new Date();
      veryOldDate.setDate(veryOldDate.getDate() - 30);

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            versions: {
              "3.0.0": {},
              "3.1.0": {},
              "3.2.0": {},
            },
            time: {
              "3.0.0": veryOldDate.toISOString(),
              "3.1.0": olderDate.toISOString(),
              "3.2.0": newestOldDate.toISOString(),
            },
          }),
      });

      const result = await service.resolveLatestSafeVersion("vue");

      expect(result.version).toBe("3.2.0");
      expect(result.tooNew).toBeFalsy();
      expect(result.ageInDays).toBeGreaterThan(0);
    });

    it("filters out prerelease versions", async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 14);

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            versions: {
              "3.0.0": {},
              "3.1.0-beta.1": {},
              "3.2.0-alpha": {},
            },
            time: {
              "3.0.0": oldDate.toISOString(),
              "3.1.0-beta.1": oldDate.toISOString(),
              "3.2.0-alpha": oldDate.toISOString(),
            },
          }),
      });

      const result = await service.resolveLatestSafeVersion("vue");

      expect(result.version).toBe("3.0.0");
      expect(result.tooNew).toBeFalsy();
    });

    it("returns null when no version meets safety buffer", async () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 1);

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            versions: {
              "3.0.0": {},
            },
            time: {
              "3.0.0": recentDate.toISOString(),
            },
          }),
      });

      const result = await service.resolveLatestSafeVersion("vue");

      expect(result.version).toBeNull();
      expect(result.tooNew).toBeTruthy();
    });

    it("returns null when all versions are prerelease", async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 14);

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            versions: {
              "3.0.0-beta.1": {},
              "3.1.0-alpha": {},
            },
            time: {
              "3.0.0-beta.1": oldDate.toISOString(),
              "3.1.0-alpha": oldDate.toISOString(),
            },
          }),
      });

      const result = await service.resolveLatestSafeVersion("vue");

      expect(result.version).toBeNull();
      expect(result.tooNew).toBeTruthy();
    });

    it("throws RegistryFetchError when registry returns non-ok status", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(service.resolveLatestSafeVersion("nonexistent-package")).rejects.toThrow(RegistryFetchError);
    });

    it("throws RegistryParseError when response has no versions", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            time: {},
          }),
      });

      await expect(service.resolveLatestSafeVersion("vue")).rejects.toThrow(RegistryParseError);
    });

    it("throws RegistryParseError when response has no time data", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            versions: {},
          }),
      });

      await expect(service.resolveLatestSafeVersion("vue")).rejects.toThrow(RegistryParseError);
    });

    it("handles scoped packages correctly", async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 14);

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            versions: {
              "5.0.0": {},
            },
            time: {
              "5.0.0": oldDate.toISOString(),
            },
          }),
      });

      const result = await service.resolveLatestSafeVersion("@vue/cli");

      expect(result.version).toBe("5.0.0");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("@vue"),
        expect.any(Object),
      );
    });
  });

  describe("validateVersion()", () => {
    it("returns version when it exists and meets safety buffer", async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 14);

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            versions: {
              "3.2.0": {},
            },
            time: {
              "3.2.0": oldDate.toISOString(),
            },
          }),
      });

      const result = await service.validateVersion("vue", "3.2.0");

      expect(result.version).toBe("3.2.0");
      expect(result.tooNew).toBeFalsy();
      expect(result.ageInDays).toBeGreaterThan(0);
    });

    it("returns tooNew=true when version is within safety buffer", async () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 1);

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            versions: {
              "3.2.0": {},
            },
            time: {
              "3.2.0": recentDate.toISOString(),
            },
          }),
      });

      const result = await service.validateVersion("vue", "3.2.0");

      expect(result.version).toBe("3.2.0");
      expect(result.tooNew).toBeTruthy();
      expect(result.ageInDays).toBe(1);
    });

    it("throws error when version does not exist", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            versions: {
              "3.2.0": {},
            },
            time: {
              "3.2.0": new Date().toISOString(),
            },
          }),
      });

      await expect(service.validateVersion("vue", "3.3.0")).rejects.toThrow(
        "Version 3.3.0 not found for package vue",
      );
    });

    it("handles scoped packages correctly", async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 14);

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            versions: {
              "5.0.0": {},
            },
            time: {
              "5.0.0": oldDate.toISOString(),
            },
          }),
      });

      const result = await service.validateVersion("@vue/cli", "5.0.0");

      expect(result.version).toBe("5.0.0");
      expect(result.tooNew).toBeFalsy();
    });

    it("throws RegistryFetchError when registry returns non-ok status", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(service.validateVersion("nonexistent-package", "1.0.0")).rejects.toThrow(RegistryFetchError);
    });
  });

  describe("retry logic", () => {
    beforeEach(() => {
      // Mock timers for testing delays
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("succeeds on first attempt without retries", async () => {
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

      const promise = service.resolveLatestSafeVersion("vue");
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.version).toBe("3.0.0");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("retries once on network error and succeeds", async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 14);

      // First call fails, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              versions: { "3.0.0": {} },
              time: { "3.0.0": oldDate.toISOString() },
            }),
        });

      const promise = service.resolveLatestSafeVersion("vue");
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.version).toBe("3.0.0");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("retries twice on network errors and succeeds on third attempt", async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 14);

      // First two calls fail, third succeeds
      mockFetch
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              versions: { "3.0.0": {} },
              time: { "3.0.0": oldDate.toISOString() },
            }),
        });

      const promise = service.resolveLatestSafeVersion("vue");
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.version).toBe("3.0.0");
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("fails after all retries exhausted", async () => {
      // All attempts fail
      mockFetch.mockRejectedValue(new Error("Network error"));

      const promise = service.resolveLatestSafeVersion("vue");

      // Run timers and expect rejection to happen together
      const [result] = await Promise.all([
        expect(promise).rejects.toThrow(RegistryFetchError),
        vi.runAllTimersAsync(),
      ]);

      expect(mockFetch).toHaveBeenCalledTimes(3); // 3 attempts total
    });

    it("does not retry on 404 errors", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      const promise = service.resolveLatestSafeVersion("nonexistent-package");

      // Run timers and expect rejection to happen together
      await Promise.all([
        expect(promise).rejects.toThrow(RegistryFetchError),
        vi.runAllTimersAsync(),
      ]);

      expect(mockFetch).toHaveBeenCalledTimes(1); // No retries
    });

    it("does not retry on parse errors", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ versions: {} }), // Missing 'time'
      });

      const promise = service.resolveLatestSafeVersion("vue");

      // Run timers and expect rejection to happen together
      await Promise.all([
        expect(promise).rejects.toThrow(RegistryParseError),
        vi.runAllTimersAsync(),
      ]);

      expect(mockFetch).toHaveBeenCalledTimes(1); // No retries
    });

    it("retries on 500 errors", async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 14);

      // First call returns 500, second succeeds
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              versions: { "3.0.0": {} },
              time: { "3.0.0": oldDate.toISOString() },
            }),
        });

      const promise = service.resolveLatestSafeVersion("vue");
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.version).toBe("3.0.0");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("applies exponential backoff delays", async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 14);

      // First two calls fail, third succeeds
      mockFetch
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              versions: { "3.0.0": {} },
              time: { "3.0.0": oldDate.toISOString() },
            }),
        });

      const promise = service.resolveLatestSafeVersion("vue");

      // First attempt should happen immediately
      await vi.advanceTimersByTimeAsync(0);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second attempt after 1 second (2^0 * 1000ms)
      await vi.advanceTimersByTimeAsync(1000);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Third attempt after 2 seconds (2^1 * 1000ms)
      await vi.advanceTimersByTimeAsync(2000);
      expect(mockFetch).toHaveBeenCalledTimes(3);

      const result = await promise;
      expect(result.version).toBe("3.0.0");
    });
  });
});
