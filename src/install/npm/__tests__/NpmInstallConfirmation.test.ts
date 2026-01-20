import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("chalk", () => ({
  default: {
    bold: (s: string) => `[bold]${s}[/bold]`,
  },
}));

vi.mock("../../../logger", () => ({
  logger: {
    header: vi.fn(),
    info: vi.fn(),
    skip: vi.fn(),
    error: vi.fn(),
    spinner: vi.fn(() => ({
      succeed: vi.fn(),
      fail: vi.fn(),
    })),
  },
}));

vi.mock("@inquirer/prompts", () => ({
  confirm: vi.fn(),
}));

vi.mock("../../../errors", () => ({
  withCancellationHandling: vi.fn((fn) => fn()),
}));

import { NpmInstallConfirmation } from "../NpmInstallConfirmation";
import { logger } from "../../../logger";
import { confirm } from "@inquirer/prompts";

describe("NpmInstallConfirmation", () => {
  let confirmation: NpmInstallConfirmation;

  beforeEach(() => {
    vi.clearAllMocks();
    confirmation = new NpmInstallConfirmation();
  });

  describe("showHeader()", () => {
    it("displays header with npm fallback message", () => {
      confirmation.showHeader();

      expect(logger.header).toHaveBeenCalledWith(
        "Installing packages via npm (fallback mode)",
        "📦"
      );
    });
  });

  describe("showPackageList()", () => {
    it("displays single package with bold formatting", () => {
      confirmation.showPackageList(["chalk@5.0.0"]);

      expect(logger.info).toHaveBeenCalledWith(
        "Packages to install: [bold]chalk@5.0.0[/bold]"
      );
    });

    it("displays multiple packages with bold formatting", () => {
      confirmation.showPackageList(["chalk@5.0.0", "lodash@4.17.21"]);

      expect(logger.info).toHaveBeenCalledWith(
        "Packages to install: [bold]chalk@5.0.0[/bold], [bold]lodash@4.17.21[/bold]"
      );
    });
  });

  describe("confirmInstall()", () => {
    it("prompts user with correct message", async () => {
      vi.mocked(confirm).mockResolvedValue(true);

      await confirmation.confirmInstall();

      expect(confirm).toHaveBeenCalledWith({
        message: "Do you want to install these packages via npm?",
        default: false,
      });
    });

    it("returns true when user confirms", async () => {
      vi.mocked(confirm).mockResolvedValue(true);

      const result = await confirmation.confirmInstall();

      expect(result).toBeTruthy();
    });

    it("returns false when user declines", async () => {
      vi.mocked(confirm).mockResolvedValue(false);

      const result = await confirmation.confirmInstall();

      expect(result).toBeFalsy();
    });

    it("logs skip message when user declines", async () => {
      vi.mocked(confirm).mockResolvedValue(false);

      await confirmation.confirmInstall();

      expect(logger.skip).toHaveBeenCalledWith("Skipping npm installation");
    });

    it("does not log skip message when user confirms", async () => {
      vi.mocked(confirm).mockResolvedValue(true);

      await confirmation.confirmInstall();

      expect(logger.skip).not.toHaveBeenCalled();
    });
  });

  describe("showInstallProgress()", () => {
    it("creates spinner with correct message", () => {
      confirmation.showInstallProgress();

      expect(logger.spinner).toHaveBeenCalledWith("Installing packages...");
    });

    it("returns spinner instance", () => {
      const spinner = confirmation.showInstallProgress();

      expect(spinner).toBeDefined();
      expect(spinner.succeed).toBeDefined();
      expect(spinner.fail).toBeDefined();
    });
  });

  describe("showSuccess()", () => {
    it("calls spinner succeed with success message", () => {
      const mockSpinner = { succeed: vi.fn(), fail: vi.fn() };

      confirmation.showSuccess(mockSpinner as any);

      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        "All packages installed successfully"
      );
    });
  });

  describe("showFailure()", () => {
    it("calls spinner fail with failure message", () => {
      const mockSpinner = { succeed: vi.fn(), fail: vi.fn() };

      confirmation.showFailure(mockSpinner as any);

      expect(mockSpinner.fail).toHaveBeenCalledWith("Failed to install packages");
    });

    it("logs error message", () => {
      const mockSpinner = { succeed: vi.fn(), fail: vi.fn() };

      confirmation.showFailure(mockSpinner as any);

      expect(logger.error).toHaveBeenCalledWith("Update process aborted");
    });
  });
});
