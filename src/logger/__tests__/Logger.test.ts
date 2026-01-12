import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock external dependencies
vi.mock("chalk", () => ({
  default: {
    green: (s: string) => `[green]${s}[/green]`,
    red: (s: string) => `[red]${s}[/red]`,
    yellow: (s: string) => `[yellow]${s}[/yellow]`,
    blue: (s: string) => `[blue]${s}[/blue]`,
    cyan: (s: string) => `[cyan]${s}[/cyan]`,
    gray: (s: string) => `[gray]${s}[/gray]`,
    white: (s: string) => `[white]${s}[/white]`,
    dim: (s: string) => `[dim]${s}[/dim]`,
    bold: Object.assign((s: string) => `[bold]${s}[/bold]`, {
      white: (s: string) => `[bold.white]${s}[/bold.white]`,
      cyan: (s: string) => `[bold.cyan]${s}[/bold.cyan]`,
    }),
  },
}));

const mockSpinner = {
  start: vi.fn().mockReturnThis(),
  stop: vi.fn().mockReturnThis(),
  succeed: vi.fn().mockReturnThis(),
  fail: vi.fn().mockReturnThis(),
};

vi.mock("ora", () => ({
  default: vi.fn(() => mockSpinner),
}));

vi.mock("cli-table3", () => {
  return {
    default: class MockTable {
      push = vi.fn();
      toString = vi.fn().mockReturnValue("[table]");
    },
  };
});

describe("Logger", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let logger: typeof import("../Logger").logger;

  beforeEach(async () => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.resetModules();
    const module = await import("../Logger");
    logger = module.logger;
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe("header()", () => {
    it("logs header with title", () => {
      logger.header("Test Header");

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("[table]"));
    });

    it("logs header with emoji prefix", () => {
      logger.header("Test Header", "🚀");

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("divider()", () => {
    it("logs a divider line", () => {
      logger.divider();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("[dim]"));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("─".repeat(60)));
    });
  });

  describe("success()", () => {
    it("logs success message with green checkmark", () => {
      logger.success("Operation completed");

      expect(consoleSpy).toHaveBeenCalledWith("[green]✓[/green] Operation completed");
    });
  });

  describe("error()", () => {
    it("logs error message with red X", () => {
      logger.error("Something failed");

      expect(consoleSpy).toHaveBeenCalledWith("[red]✗[/red] [red]Something failed[/red]");
    });
  });

  describe("warning()", () => {
    it("logs warning message with yellow icon", () => {
      logger.warning("Be careful");

      expect(consoleSpy).toHaveBeenCalledWith("[yellow]⚠[/yellow] [yellow]Be careful[/yellow]");
    });
  });

  describe("info()", () => {
    it("logs info message with blue icon", () => {
      logger.info("Here is some info");

      expect(consoleSpy).toHaveBeenCalledWith("[blue]ℹ[/blue] [cyan]Here is some info[/cyan]");
    });
  });

  describe("progress()", () => {
    it("logs indented progress message", () => {
      logger.progress("Doing something");

      expect(consoleSpy).toHaveBeenCalledWith("[dim]  → Doing something[/dim]");
    });
  });

  describe("skip()", () => {
    it("logs skip message with gray icon", () => {
      logger.skip("Skipped this step");

      expect(consoleSpy).toHaveBeenCalledWith("[gray]⊘[/gray] [dim]Skipped this step[/dim]");
    });
  });

  describe("package()", () => {
    it("logs package message with name and action", () => {
      logger.package("lodash", "updating to 4.18.0");

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[bold]📦[/bold]")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[bold]lodash[/bold]")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("updating to 4.18.0")
      );
    });
  });

  describe("step()", () => {
    it("logs step with number and total", () => {
      logger.step(1, 5, "Installing dependencies");

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[bold.cyan][1/5][/bold.cyan]")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Installing dependencies")
      );
    });
  });

  describe("spinner()", () => {
    it("creates and starts a spinner", async () => {
      const ora = (await import("ora")).default;

      const spinner = logger.spinner("Loading...");

      expect(ora).toHaveBeenCalledWith({
        text: "Loading...",
        color: "cyan",
        spinner: "dots",
      });
      expect(mockSpinner.start).toHaveBeenCalled();
      expect(spinner).toBe(mockSpinner);
    });

    it("stops existing spinner when creating new one", async () => {
      logger.spinner("First spinner");
      mockSpinner.stop.mockClear();

      logger.spinner("Second spinner");

      expect(mockSpinner.stop).toHaveBeenCalled();
    });
  });

  describe("stopSpinner()", () => {
    it("stops active spinner", () => {
      logger.spinner("Loading...");
      mockSpinner.stop.mockClear();

      logger.stopSpinner();

      expect(mockSpinner.stop).toHaveBeenCalled();
    });

    it("does nothing when no active spinner", () => {
      logger.stopSpinner();
      logger.stopSpinner();

      // Should not throw
      expect(true).toBeTruthy();
    });
  });

  describe("summaryTable()", () => {
    it("logs a summary table with title and data", () => {
      logger.summaryTable("Summary", {
        "Total packages": 10,
        "Updated": 5,
        "Status": "complete",
      });

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("[table]"));
    });
  });

  describe("updatesTable()", () => {
    it("logs updates table with package information", () => {
      logger.updatesTable([
        { name: "lodash", current: "4.17.0", new: "4.18.0", type: "minor" },
        { name: "express", current: "4.17.0", new: "5.0.0", type: "major" },
      ]);

      expect(consoleSpy).toHaveBeenCalled();
    });

    it("handles empty updates array", () => {
      logger.updatesTable([]);

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("newLine()", () => {
    it("logs an empty line", () => {
      logger.newLine();

      expect(consoleSpy).toHaveBeenCalledWith("");
    });
  });
});
