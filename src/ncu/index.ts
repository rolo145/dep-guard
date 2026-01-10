/**
 * NCU Module
 *
 * Provides npm-check-updates integration for update discovery and selection.
 *
 * @module ncu
 */
export { NCUService } from "./NCUService";
export { NCURegistryService } from "./NCURegistryService";
export { NCURunner } from "./NCURunner";
export { NCUConfirmation } from "./NCUConfirmation";
export { PromptChoiceBuilder } from "./PromptChoiceBuilder";
export type { PromptChoice } from "./PromptChoiceBuilder";
export { PROMPT_PAGE_SIZE } from "./constants";
export { VersionAnalyzer } from "./VersionAnalyzer";
export { VersionFormatter } from "./VersionFormatter";
export type {
  NpmRegistryResponse,
  VersionBumpType,
  PackageUpdate,
  GroupedUpdates,
  PackageSelection,
} from "./types";
export {
  RegistryError,
  RegistryFetchError,
  RegistryParseError,
} from "./errors";
