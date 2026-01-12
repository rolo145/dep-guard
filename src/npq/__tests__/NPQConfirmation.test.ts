import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("chalk", () => ({
  default: {
    bold: (s: string) => `[bold]${s}[/bold]`,
    green: (s: string) => `[green]${s}[/green]`,
    red: (s: string) => `[red]${s}[/red]`,
  },
}));

vi.mock("../../logger", () => ({
  logger: {
    success: vi.fn(),
    warning: vi.fn(),
    skip: vi.fn(),
    header: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@inquirer/prompts", () => ({
  confirm: vi.fn(),
}));

vi.mock("../../errors", () => ({
  withCancellationHandling: vi.fn((fn) => fn()),
}));

import { NPQConfirmation } from "../NPQConfirmation";
import { logger } from "../../logger";
import { confirm } from "@inquirer/prompts";

describe("NPQConfirmation", () => {
  let confirmation: NPQConfirmation;

  beforeEach(() => {
    vi.clearAllMocks();
    confirmation = new NPQConfirmation();
  });

  describe("displayResult()", () => {
    it("logs success when check passed", () => {
      confirmation.displayResult("lodash@5.0.0", true);

      expect(logger.success).toHaveBeenCalledWith("NPQ security check passed");
    });

    it("logs warning when check failed", () => {
      confirmation.displayResult("malicious@1.0.0", false);

      expect(logger.warning).toHaveBeenCalledWith(
        "NPQ security check failed for [bold]malicious@1.0.0[/bold]"
      );
    });
  });

  describe("confirm()", () => {
    it("prompts with passed status when NPQ passed", async () => {
      vi.mocked(confirm).mockResolvedValue(true);

      await confirmation.confirm("lodash@5.0.0", true);

      expect(confirm).toHaveBeenCalledWith({
        message: "Install [bold]lodash@5.0.0[/bold]? [green](NPQ: passed)[/green]",
        default: false,
      });
    });

    it("prompts with failed status when NPQ failed", async () => {
      vi.mocked(confirm).mockResolvedValue(false);

      await confirmation.confirm("malicious@1.0.0", false);

      expect(confirm).toHaveBeenCalledWith({
        message: "Install [bold]malicious@1.0.0[/bold]? [red](NPQ: failed)[/red]",
        default: false,
      });
    });

    it("returns true when user confirms", async () => {
      vi.mocked(confirm).mockResolvedValue(true);

      const result = await confirmation.confirm("lodash@5.0.0", true);

      expect(result).toBeTruthy();
    });

    it("returns false when user declines", async () => {
      vi.mocked(confirm).mockResolvedValue(false);

      const result = await confirmation.confirm("lodash@5.0.0", true);

      expect(result).toBeFalsy();
    });

    it("logs skip message when user declines", async () => {
      vi.mocked(confirm).mockResolvedValue(false);

      await confirmation.confirm("lodash@5.0.0", true);

      expect(logger.skip).toHaveBeenCalledWith("Skipping lodash@5.0.0");
    });

    it("does not log skip message when user confirms", async () => {
      vi.mocked(confirm).mockResolvedValue(true);

      await confirmation.confirm("lodash@5.0.0", true);

      expect(logger.skip).not.toHaveBeenCalled();
    });
  });

  describe("showPackageHeader()", () => {
    it("logs header with package spec", () => {
      confirmation.showPackageHeader("lodash@5.0.0");

      expect(logger.header).toHaveBeenCalledWith("Processing lodash@5.0.0", "🔐");
    });
  });

  describe("showCheckStarted()", () => {
    it("logs info message with package spec", () => {
      confirmation.showCheckStarted("lodash@5.0.0");

      expect(logger.info).toHaveBeenCalledWith(
        "Running npq security check for [bold]lodash@5.0.0[/bold]"
      );
    });
  });
});
