/**
 * Install Module
 *
 * Provides dependency installation and reinstall workflow support.
 * Includes root orchestrator and child services for CI, SCFW, and npm fallback installations.
 *
 * @module install
 */
// Root Install Orchestrator
export { InstallService } from "./InstallService";
export { InstallRunner, type InstallRunnerResult } from "./InstallRunner";
export { InstallConfirmation } from "./InstallConfirmation";

// CI Install (npm ci)
export { CIInstallService } from "./ci/CIInstallService";
export { CIInstallRunner, type CIInstallResult } from "./ci/CIInstallRunner";
export { CIInstallConfirmation } from "./ci/CIInstallConfirmation";

// SCFW Install (Supply Chain Firewall)
export { SCFWService } from "./scfw/SCFWService";
export { SCFWRunner, type SCFWInstallResult } from "./scfw/SCFWRunner";
export { SCFWConfirmation } from "./scfw/SCFWConfirmation";

// NPM Install (fallback when scfw is not available)
export { NpmInstallService } from "./npm/NpmInstallService";
export { NpmInstallRunner, type NpmInstallResult } from "./npm/NpmInstallRunner";
export { NpmInstallConfirmation } from "./npm/NpmInstallConfirmation";
