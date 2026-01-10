/**
 * Prompt Choice Builder
 *
 * Builds structured choice lists for interactive prompts.
 * Uses the builder pattern to construct grouped package update choices.
 *
 * @module ncu/PromptChoiceBuilder
 */
import chalk from "chalk";
import type { GroupedUpdates, VersionBumpType } from "./types";
import type { PackageSelection } from "./types";
import { VersionFormatter } from "./VersionFormatter";

/**
 * Choice item structure for inquirer checkbox prompt
 */
export interface PromptChoice {
  /** Display text shown to user */
  name: string;
  /** Value returned when selected */
  value: PackageSelection;
  /** Whether item is selected by default */
  checked: boolean;
  /** If set, item is disabled (true) or shows this message */
  disabled?: boolean | string;
}

/**
 * Creates a clickable hyperlink for terminals that support OSC 8
 * Falls back to plain text in unsupported terminals
 */
function createTerminalHyperlink(url: string, text: string): string {
  return `\x1b]8;;${url}\x07${text}\x1b]8;;\x07`;
}

interface GroupConfig {
  type: VersionBumpType;
  colorFn: (text: string) => string;
  label: string;
  description: string;
}

/**
 * Builds formatted choices for interactive package selection prompts.
 *
 * Creates a structured list of packages organized by update type (patch, minor, major).
 * Each group has a bold colored header and aligned package listings.
 *
 * @example
 * ```typescript
 * const choices = new PromptChoiceBuilder(grouped, maxNameLength)
 *   .addPatchGroup()
 *   .addMinorGroup()
 *   .addMajorGroup()
 *   .build();
 * ```
 */
export class PromptChoiceBuilder {
  private choices: PromptChoice[] = [];
  private grouped: GroupedUpdates;
  private maxNameLength: number;

  private static readonly GROUP_CONFIGS: Record<VersionBumpType, GroupConfig> = {
    patch: {
      type: "patch",
      colorFn: chalk.green,
      label: "Patch",
      description: "Backwards-compatible bug fixes",
    },
    minor: {
      type: "minor",
      colorFn: chalk.blue,
      label: "Minor",
      description: "Backwards-compatible features",
    },
    major: {
      type: "major",
      colorFn: chalk.red,
      label: "Major",
      description: "Potentially breaking API changes",
    },
  };

  constructor(grouped: GroupedUpdates, maxNameLength: number) {
    this.grouped = grouped;
    this.maxNameLength = maxNameLength;
  }

  /**
   * Adds a group of updates to the choices
   */
  private addGroup(config: GroupConfig): this {
    const packages = this.grouped[config.type];

    // Skip empty groups
    if (packages.length === 0) {
      return this;
    }

    // Add group header (disabled, just for display)
    const header = config.colorFn(`${config.label} (${packages.length})`);
    const desc = chalk.dim(` - ${config.description}`);
    this.choices.push({
      name: `\n${chalk.bold(header)}${desc}`,
      value: { name: "", version: "" },
      checked: false,
      disabled: " ",
    });

    // Add packages in this group
    packages.forEach(({ name, currentVersion, newVersion }) => {
      const padding = " ".repeat(this.maxNameLength - name.length + 2);
      const versionDisplay = VersionFormatter.formatWithHighlight(currentVersion, newVersion, config.type);
      const npmUrl = `https://www.npmjs.com/package/${name}`;
      const npmLink = chalk.dim(createTerminalHyperlink(npmUrl, `npmjs.com/package/${name}`));

      this.choices.push({
        name: `  ${name}${padding}${versionDisplay}  ${npmLink}`,
        value: { name, version: newVersion },
        checked: false,
      });
    });

    return this;
  }

  /**
   * Adds patch updates group (green - bug fixes)
   */
  addPatchGroup(): this {
    return this.addGroup(PromptChoiceBuilder.GROUP_CONFIGS.patch);
  }

  /**
   * Adds minor updates group (blue - new features)
   */
  addMinorGroup(): this {
    return this.addGroup(PromptChoiceBuilder.GROUP_CONFIGS.minor);
  }

  /**
   * Adds major updates group (red - breaking changes)
   */
  addMajorGroup(): this {
    return this.addGroup(PromptChoiceBuilder.GROUP_CONFIGS.major);
  }

  /**
   * Returns the built choices array
   */
  build(): PromptChoice[] {
    return this.choices;
  }
}
