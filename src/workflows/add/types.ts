/**
 * Add Workflow Types
 *
 * Type definitions for the add command workflow.
 * These types represent the data structures passed between workflow steps.
 *
 * @module workflows/add/types
 */

/**
 * Represents a parsed package specification from user input
 */
export interface PackageSpec {
  /** Package name (e.g., "vue" or "@vue/cli") */
  name: string;
  /** Optional version (e.g., "3.2.0"). Undefined means "latest" */
  version?: string;
}

/**
 * Represents a resolved package with concrete version
 */
export interface ResolvedPackage {
  /** Package name */
  name: string;
  /** Concrete version (no longer optional) */
  version: string;
  /** Whether the user specified the version explicitly */
  wasSpecified: boolean;
  /** Age of the version in days */
  ageInDays?: number;
}

/**
 * Information about an existing package in package.json
 */
export interface ExistingPackageInfo {
  /** Whether the package already exists */
  exists: boolean;
  /** Current version if exists */
  currentVersion?: string;
  /** Location where package exists */
  location?: "dependencies" | "devDependencies";
}

/**
 * Represents a package ready to be added (after checking existing state)
 */
export interface PackageToAdd extends ResolvedPackage {
  /** Whether to save as dev dependency */
  saveDev: boolean;
  /** Information about existing package state */
  existing: ExistingPackageInfo;
}

/**
 * Represents a package confirmed by user after security validation
 */
export interface ConfirmedPackage extends PackageToAdd {
  /** Whether NPQ security checks passed */
  npqPassed: boolean;
  /** Whether user confirmed installation */
  userConfirmed: boolean;
}

/**
 * Represents a successfully installed package
 */
export interface InstalledPackage extends ConfirmedPackage {
  /** Whether installation succeeded */
  installSuccess: boolean;
}

/**
 * Options for the add workflow
 */
export interface AddWorkflowOptions {
  /** Package specification from user */
  packageSpec: PackageSpec;
  /** Safety buffer in days */
  days: number;
  /** Script options for quality checks */
  scripts: {
    lint: string;
    typecheck: string;
    test: string;
    build: string;
  };
  /** Whether to use npm install fallback */
  useNpmFallback: boolean;
  /** Whether to save as dev dependency */
  saveDev: boolean;
}

/**
 * Result of the add workflow
 */
export interface AddWorkflowResult {
  /** Whether the workflow completed successfully */
  success: boolean;
  /** Exit code */
  exitCode: number;
  /** Error message if failed */
  errorMessage?: string;
  /** Installed package information if successful */
  package?: InstalledPackage;
}
