/**
 * Interactive Prompts
 *
 * Provides builders for interactive command-line prompts used throughout
 * the update workflow. Creates structured choice lists for the inquirer
 * checkbox prompt.
 *
 * @module ui/prompts
 */
import type { GroupedUpdates } from "../ncu";
import { PromptChoiceBuilder, type PromptChoice } from "./PromptChoiceBuilder";

/**
 * Creates formatted choices array for the interactive package selection prompt
 *
 * Builds a structured list of packages organized by update type (patch, minor, major).
 * Each group has:
 * - Bold colored header showing update type and count
 * - List of packages with aligned version displays
 *
 * @param grouped - Package updates organized by bump type
 * @param maxNameLength - Maximum length of package names (for alignment)
 * @returns Array of choice objects for inquirer checkbox prompt
 */
export function createUpdateChoices(
  grouped: GroupedUpdates,
  maxNameLength: number,
): PromptChoice[] {
  return new PromptChoiceBuilder(grouped, maxNameLength)
    .addPatchGroup()
    .addMinorGroup()
    .addMajorGroup()
    .build();
}
