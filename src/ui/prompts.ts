/**
 * Interactive Prompts
 *
 * Provides builders for interactive command-line prompts used throughout
 * the update workflow. Creates structured choice lists for the inquirer
 * checkbox prompt.
 *
 * @module ui/prompts
 */
import chalk from "chalk";
import type { GroupedUpdates, VersionBumpType, PackageSelection } from "../types/updates";
import { formatVersionWithHighlight } from "./formatters";

/**
 * Creates a clickable hyperlink for terminals that support OSC 8
 * Falls back to plain text in unsupported terminals
 */
function hyperlink(url: string, text: string): string {
  // OSC 8 hyperlink format: \x1b]8;;URL\x07TEXT\x1b]8;;\x07
  return `\x1b]8;;${url}\x07${text}\x1b]8;;\x07`;
}

/**
 * Choice item structure for inquirer checkbox prompt
 * @internal
 */
interface PromptChoice {
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
 * Creates formatted choices array for the interactive package selection prompt
 *
 * Builds a structured list of packages organized by update type (patch, minor, major).
 * Each group has:
 * - Bold colored header showing update type and count
 * - List of packages with aligned version displays
 *
 * Package names are padded to align version information vertically,
 * making it easier to scan and compare updates.
 *
 * @param grouped - Package updates organized by bump type
 * @param maxNameLength - Maximum length of package names (for alignment)
 * @returns Array of choice objects for inquirer checkbox prompt
 */
export function createUpdateChoices(
  grouped: GroupedUpdates,
  maxNameLength: number,
): PromptChoice[] {
  const choices: PromptChoice[] = [];

  /**
   * Adds a group of updates to the choices array
   * @internal
   */
  const addGroup = (
    type: VersionBumpType,
    colorFn: (text: string) => string,
    label: string,
    description: string,
  ) => {
    // Skip empty groups
    if (grouped[type].length === 0) {
      return;
    }

    // Add group header (disabled, just for display)
    const header = colorFn(`${label} (${grouped[type].length})`);
    const desc = chalk.dim(` - ${description}`);
    choices.push({
      name: `\n${chalk.bold(header)}${desc}`,
      value: { name: "", version: "" },
      checked: false,
      disabled: " ", // Space prevents "undefined" from showing
    });

    // Add packages in this group
    grouped[type].forEach(({ name, currentVersion, newVersion }) => {
      // Calculate padding to align version displays
      const padding = " ".repeat(maxNameLength - name.length + 2);

      // Format version comparison with color highlighting
      const versionDisplay = formatVersionWithHighlight(
        currentVersion,
        newVersion,
        type,
      );

      // npm package link (clickable in supported terminals)
      const npmUrl = `https://www.npmjs.com/package/${name}`;
      const npmLink = chalk.dim(hyperlink(npmUrl, `npmjs.com/package/${name}`));

      choices.push({
        name: `  ${name}${padding}${versionDisplay}  ${npmLink}`,
        value: { name, version: newVersion },
        checked: false,
      });
    });
  };

  // Add groups in order of increasing risk (patch -> minor -> major)
  // This encourages users to review safer updates first
  addGroup("patch", chalk.green, "Patch", "Backwards-compatible bug fixes");
  addGroup("minor", chalk.blue, "Minor", "Backwards-compatible features");
  addGroup("major", chalk.red, "Major", "Potentially breaking API changes");

  return choices;
}
