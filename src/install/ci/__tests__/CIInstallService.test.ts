import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRunnerInstance = {
  run: vi.fn(),
};

const mockConfirmationInstance = {
  showHeader: vi.fn(),
  confirmRun: vi.fn(),
  showProgress: vi.fn(),
  showSuccess: vi.fn(),
  showFailure: vi.fn(),
};

vi.mock("../CIInstallRunner", () => ({
  CIInstallRunner: class {
    run = mockRunnerInstance.run;
  },
}));

vi.mock("../CIInstallConfirmation", () => ({
  CIInstallConfirmation: class {
    showHeader = mockConfirmationInstance.showHeader;
    confirmRun = mockConfirmationInstance.confirmRun;
    showProgress = mockConfirmationInstance.showProgress;
    showSuccess = mockConfirmationInstance.showSuccess;
    showFailure = mockConfirmationInstance.showFailure;
  },
}));

import { CIInstallService } from "../CIInstallService";

describe("CIInstallService", () => {
  let service: CIInstallService;
  let mockSpinner: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock spinner
    mockSpinner = {
      succeed: vi.fn(),
      fail: vi.fn(),
    };

    mockConfirmationInstance.showProgress.mockReturnValue(mockSpinner);

    // Create service instance
    service = new CIInstallService();
  });

  describe("run()", () => {
    it("shows header when run is called", async () => {
      mockConfirmationInstance.confirmRun.mockResolvedValue(false);

      await service.run();

      expect(mockConfirmationInstance.showHeader).toHaveBeenCalledOnce();
    });

    it("returns null when user declines reinstall", async () => {
      mockConfirmationInstance.confirmRun.mockResolvedValue(false);

      const result = await service.run();

      expect(result).toBe(null);
      expect(mockRunnerInstance.run).not.toHaveBeenCalled();
    });

    it("runs npm ci when user confirms", async () => {
      mockConfirmationInstance.confirmRun.mockResolvedValue(true);
      mockRunnerInstance.run.mockReturnValue({ success: true });

      await service.run();

      expect(mockConfirmationInstance.confirmRun).toHaveBeenCalledOnce();
      expect(mockConfirmationInstance.showProgress).toHaveBeenCalledOnce();
      expect(mockRunnerInstance.run).toHaveBeenCalledOnce();
    });

    it("returns true when reinstall succeeds", async () => {
      mockConfirmationInstance.confirmRun.mockResolvedValue(true);
      mockRunnerInstance.run.mockReturnValue({ success: true });

      const result = await service.run();

      expect(result).toBe(true);
      expect(mockConfirmationInstance.showSuccess).toHaveBeenCalledWith(mockSpinner);
    });

    it("throws InstallationFailureError when reinstall fails", async () => {
      mockConfirmationInstance.confirmRun.mockResolvedValue(true);
      mockRunnerInstance.run.mockReturnValue({ success: false });

      await expect(service.run()).rejects.toThrow("CI reinstall failed");

      expect(mockConfirmationInstance.showFailure).toHaveBeenCalledWith(mockSpinner);
    });

    it("does not show success/failure when user declines", async () => {
      mockConfirmationInstance.confirmRun.mockResolvedValue(false);

      await service.run();

      expect(mockConfirmationInstance.showSuccess).not.toHaveBeenCalled();
      expect(mockConfirmationInstance.showFailure).not.toHaveBeenCalled();
    });
  });
});
