import { describe, it, expect } from "vitest";
import { continueWith, continueWithStep, exitWith } from "../IWorkflowStep";

describe("IWorkflowStep helpers", () => {
  describe("continueWith()", () => {
    it("creates a continue result", () => {
      const result = continueWith({ foo: "bar" });

      expect(result.continue).toBe(true);
    });

    it("includes the provided data", () => {
      const data = { foo: "bar", baz: 123 };
      const result = continueWith(data);

      expect(result.data).toEqual(data);
    });

    it("does not include exitReason", () => {
      const result = continueWith("test");

      expect(result.exitReason).toBeUndefined();
    });

    it("works with array data", () => {
      const data = [1, 2, 3];
      const result = continueWith(data);

      expect(result.data).toEqual([1, 2, 3]);
    });

    it("works with null data", () => {
      const result = continueWith(null);

      expect(result.data).toBeNull();
    });

    it("works with undefined data", () => {
      const result = continueWith(undefined);

      expect(result.data).toBeUndefined();
    });
  });

  describe("continueWithStep()", () => {
    it("creates a continue result", () => {
      const stepData = { step: "check_updates" as const, data: { lodash: "5.0.0" } };
      const result = continueWithStep(stepData);

      expect(result.continue).toBe(true);
    });

    it("includes both data and stepData", () => {
      const stepData = { step: "check_updates" as const, data: { lodash: "5.0.0" } };
      const result = continueWithStep(stepData);

      expect(result.data).toEqual({ lodash: "5.0.0" });
      expect(result.stepData).toEqual(stepData);
    });

    it("works with init step", () => {
      const stepData = { step: "init" as const, data: undefined };
      const result = continueWithStep(stepData);

      expect(result.stepData?.step).toBe("init");
      expect(result.data).toBeUndefined();
    });

    it("works with select step", () => {
      const packages = [{ name: "lodash", version: "5.0.0" }];
      const stepData = { step: "select" as const, data: packages };
      const result = continueWithStep(stepData);

      expect(result.stepData?.step).toBe("select");
      expect(result.data).toEqual(packages);
    });
  });

  describe("exitWith()", () => {
    it("creates a non-continue result", () => {
      const result = exitWith("no_updates_available");

      expect(result.continue).toBe(false);
    });

    it("includes the exit reason", () => {
      const result = exitWith("user_cancelled");

      expect(result.exitReason).toBe("user_cancelled");
    });

    it("does not include data", () => {
      const result = exitWith("all_updates_filtered");

      expect(result.data).toBeUndefined();
    });

    it("works with no_packages_selected", () => {
      const result = exitWith("no_packages_selected");

      expect(result.exitReason).toBe("no_packages_selected");
    });

    it("works with no_packages_confirmed", () => {
      const result = exitWith("no_packages_confirmed");

      expect(result.exitReason).toBe("no_packages_confirmed");
    });

    it("works with completed", () => {
      const result = exitWith("completed");

      expect(result.exitReason).toBe("completed");
    });
  });
});
