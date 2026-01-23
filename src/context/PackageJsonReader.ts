/**
 * Package.json Reader
 *
 * Reads and provides access to package.json data.
 * Caches the file content for efficient repeated access.
 *
 * @module context/PackageJsonReader
 */
import fs from "fs";
import { FILES } from "../constants/files";

/**
 * Parsed package.json structure
 */
export interface PackageJson {
  name?: string;
  version?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Reads and provides access to package.json data.
 */
export class PackageJsonReader {
  private readonly data: PackageJson;

  constructor(path: string = FILES.PACKAGE_JSON) {
    const content = fs.readFileSync(path, "utf8");
    this.data = JSON.parse(content);
  }

  /**
   * Gets the npm scripts from package.json
   */
  get scripts(): Record<string, string> {
    return this.data.scripts ?? {};
  }

  /**
   * Gets all dependencies (both dependencies and devDependencies)
   */
  get allDependencies(): Record<string, string> {
    return {
      ...this.data.dependencies,
      ...this.data.devDependencies,
    };
  }

  /**
   * Gets only production dependencies
   */
  get dependencies(): Record<string, string> {
    return this.data.dependencies ?? {};
  }

  /**
   * Gets only dev dependencies
   */
  get devDependencies(): Record<string, string> {
    return this.data.devDependencies ?? {};
  }

  /**
   * Gets the raw package.json object
   */
  get raw(): PackageJson {
    return this.data;
  }

  /**
   * Checks if a script exists in package.json
   */
  hasScript(name: string): boolean {
    return !!this.scripts[name];
  }

  /**
   * Checks if a package is in dependencies or devDependencies
   */
  hasPackage(name: string): boolean {
    return !!(this.data.dependencies?.[name] || this.data.devDependencies?.[name]);
  }

  /**
   * Gets the current version of a package
   */
  getPackageVersion(name: string): string | undefined {
    return this.data.dependencies?.[name] ?? this.data.devDependencies?.[name];
  }
}
