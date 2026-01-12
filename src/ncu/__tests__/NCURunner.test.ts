import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("npm-check-updates", () => ({
  run: vi.fn(),
}));

import { NCURunner } from "../NCURunner";
import { run as ncuRun } from "npm-check-updates";

describe("NCURunner", () => {
  let runner: NCURunner;

  beforeEach(() => {
    vi.clearAllMocks();
    runner = new NCURunner();
  });

  describe("loadUpdates()", () => {
    it("calls ncu with correct options", async () => {
      vi.mocked(ncuRun).mockResolvedValue({ lodash: "5.0.0" });

      await runner.loadUpdates();

      expect(ncuRun).toHaveBeenCalledWith({
        packageFile: "package.json",
        upgrade: false,
        jsonUpgraded: true,
      });
    });

    it("returns updates from ncu", async () => {
      const updates = { lodash: "5.0.0", express: "4.19.0" };
      vi.mocked(ncuRun).mockResolvedValue(updates);

      const result = await runner.loadUpdates();

      expect(result).toEqual(updates);
    });

    it("returns empty object when ncu returns null", async () => {
      vi.mocked(ncuRun).mockResolvedValue(null);

      const result = await runner.loadUpdates();

      expect(result).toEqual({});
    });

    it("returns empty object when ncu returns undefined", async () => {
      vi.mocked(ncuRun).mockResolvedValue(undefined);

      const result = await runner.loadUpdates();

      expect(result).toEqual({});
    });
  });
});
