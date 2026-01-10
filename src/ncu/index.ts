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
export type { NpmRegistryResponse, VersionBumpType, PackageUpdate, GroupedUpdates } from "./types";
