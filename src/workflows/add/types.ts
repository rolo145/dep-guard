export interface PackageSpec {
  name: string;
  version?: string;
}

export interface ResolvedPackage {
  name: string;
  version: string;
  wasSpecified: boolean;
  ageInDays?: number;
}

export interface ExistingPackageInfo {
  exists: boolean;
  currentVersion?: string;
  location?: "dependencies" | "devDependencies";
}

export interface PackageToAdd extends ResolvedPackage {
  saveDev: boolean;
  existing: ExistingPackageInfo;
}

export interface ConfirmedPackage extends PackageToAdd {
  npqPassed: boolean;
  userConfirmed: boolean;
}

export interface InstalledPackage extends ConfirmedPackage {
  installSuccess: boolean;
}

export interface AddWorkflowOptions {
  packageSpec: PackageSpec;
  days: number;
  scripts: {
    lint: string;
    typecheck: string;
    test: string;
    build: string;
  };
  useNpmFallback: boolean;
  saveDev: boolean;
}

export interface AddWorkflowResult {
  success: boolean;
  exitCode: number;
  errorMessage?: string;
  package?: InstalledPackage;
}
