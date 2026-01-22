import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSpinner = {
  start: vi.fn().mockReturnThis(),
  stop: vi.fn().mockReturnThis(),
};

const mockRunnerInstance = {
  loadUpdates: vi.fn(),
};

const mockConfirmationInstance = {
  showQueryingUpdates: vi.fn(() => mockSpinner),
  showNoUpdates: vi.fn(),
  showPotentialUpdates: vi.fn(),
  showNoSafeUpdates: vi.fn(),
  showSafeUpdates: vi.fn(),
  showGroupSummary: vi.fn(),
  promptSelection: vi.fn(),
};

const mockRegistryInstance = {
  filterUpdatesByAge: vi.fn(),
};

vi.mock("../NCURunner", () => ({
  NCURunner: class {
    loadUpdates = mockRunnerInstance.loadUpdates;
  },
}));

vi.mock("../NCUConfirmation", () => ({
  NCUConfirmation: class {
    showQueryingUpdates = mockConfirmationInstance.showQueryingUpdates;
    showNoUpdates = mockConfirmationInstance.showNoUpdates;
    showPotentialUpdates = mockConfirmationInstance.showPotentialUpdates;
    showNoSafeUpdates = mockConfirmationInstance.showNoSafeUpdates;
    showSafeUpdates = mockConfirmationInstance.showSafeUpdates;
    showGroupSummary = mockConfirmationInstance.showGroupSummary;
    promptSelection = mockConfirmationInstance.promptSelection;
  },
}));

vi.mock("../NCURegistryService", () => ({
  NCURegistryService: class {
    filterUpdatesByAge = mockRegistryInstance.filterUpdatesByAge;
  },
}));

import { NCUService } from "../NCUService";
import type { IExecutionContext } from "../../context/IExecutionContext";

describe("NCUService", () => {
  let service: NCUService;
  let mockContext: IExecutionContext;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
      cutoff: new Date(),
      cutoffIso: new Date().toISOString(),
      days: 7,
      allDependencies: { lodash: "^4.17.0" },
      dependencies: {},
      devDependencies: {},
      scripts: {},
      scriptNames: { lint: "lint", typecheck: "typecheck", test: "test", build: "build" },
      raw: {},
      hasScript: vi.fn(),
      hasPackage: vi.fn(),
      getPackageVersion: vi.fn(),
    };

    service = new NCUService(mockContext);
  });

  describe("loadUpdates()", () => {
    it("shows spinner while loading", async () => {
      mockRunnerInstance.loadUpdates.mockResolvedValue({});

      await service.loadUpdates();

      expect(mockConfirmationInstance.showQueryingUpdates).toHaveBeenCalled();
    });

    it("stops spinner after loading", async () => {
      mockRunnerInstance.loadUpdates.mockResolvedValue({});

      await service.loadUpdates();

      expect(mockSpinner.stop).toHaveBeenCalled();
    });

    it("returns updates from runner", async () => {
      const updates = { lodash: "5.0.0" };
      mockRunnerInstance.loadUpdates.mockResolvedValue(updates);

      const result = await service.loadUpdates();

      expect(result).toStrictEqual(updates);
    });
  });

  describe("showNoUpdates()", () => {
    it("delegates to confirmation", () => {
      service.showNoUpdates();

      expect(mockConfirmationInstance.showNoUpdates).toHaveBeenCalled();
    });
  });

  describe("showPotentialUpdates()", () => {
    it("delegates to confirmation with count", () => {
      service.showPotentialUpdates(10);

      expect(mockConfirmationInstance.showPotentialUpdates).toHaveBeenCalledWith(10);
    });
  });

  describe("filterByAge()", () => {
    it("delegates to registry service", async () => {
      const updates = { lodash: "5.0.0" };
      const filtered = { lodash: "4.19.0" };
      mockRegistryInstance.filterUpdatesByAge.mockResolvedValue(filtered);

      const result = await service.filterByAge(updates);

      expect(mockRegistryInstance.filterUpdatesByAge).toHaveBeenCalledWith(updates);
      expect(result).toStrictEqual(filtered);
    });
  });

  describe("showNoSafeUpdates()", () => {
    it("delegates to confirmation with days", () => {
      service.showNoSafeUpdates(7);

      expect(mockConfirmationInstance.showNoSafeUpdates).toHaveBeenCalledWith(7);
    });
  });

  describe("showSafeUpdates()", () => {
    it("delegates to confirmation with count", () => {
      service.showSafeUpdates(5);

      expect(mockConfirmationInstance.showSafeUpdates).toHaveBeenCalledWith(5);
    });
  });

  describe("buildChoices()", () => {
    it("returns grouped updates and choices", () => {
      const updates = { lodash: "5.0.0" };
      const deps = { lodash: "^4.17.0" };

      const result = service.buildChoices(updates, deps);

      expect(result).toHaveProperty("grouped");
      expect(result).toHaveProperty("choices");
      expect(result.grouped).toHaveProperty("major");
      expect(result.grouped).toHaveProperty("minor");
      expect(result.grouped).toHaveProperty("patch");
    });

    it("groups major updates correctly", () => {
      const updates = { lodash: "5.0.0" };
      const deps = { lodash: "^4.17.0" };

      const result = service.buildChoices(updates, deps);

      expect(result.grouped.major).toHaveLength(1);
      expect(result.grouped.major[0].name).toBe("lodash");
    });
  });

  describe("showGroupSummary()", () => {
    it("delegates to confirmation", () => {
      const grouped = { major: [], minor: [], patch: [] };

      service.showGroupSummary(grouped);

      expect(mockConfirmationInstance.showGroupSummary).toHaveBeenCalledWith(grouped);
    });
  });

  describe("promptSelection()", () => {
    it("delegates to confirmation and returns selection", async () => {
      const choices = [{ name: "test", value: { name: "lodash", version: "5.0.0" }, checked: false }];
      const selected = [{ name: "lodash", version: "5.0.0" }];
      mockConfirmationInstance.promptSelection.mockResolvedValue(selected);

      const result = await service.promptSelection(choices);

      expect(mockConfirmationInstance.promptSelection).toHaveBeenCalledWith(choices);
      expect(result).toStrictEqual(selected);
    });
  });
});
