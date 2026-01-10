/**
 * Execution Context Factory
 *
 * Factory for creating ExecutionContext instances. Provides a clean API
 * for context creation and supports different creation strategies.
 *
 * @module context/ExecutionContextFactory
 */
import type { ScriptOptions } from "../args/types";
import type { IExecutionContext } from "./IExecutionContext";
import { ExecutionContext, type ExecutionContextOptions } from "./ExecutionContext";

/**
 * Factory for creating ExecutionContext instances.
 *
 * Supports standard creation and custom configurations for testing.
 *
 * @example
 * ```typescript
 * // Standard usage
 * const context = ExecutionContextFactory.create({
 *   days: 7,
 *   scripts: { lint: 'lint', typecheck: 'typecheck', test: 'test', build: 'build' }
 * });
 *
 * // For testing with custom package.json path
 * const testContext = ExecutionContextFactory.create({
 *   days: 7,
 *   scripts,
 *   packageJsonPath: './fixtures/package.json'
 * });
 * ```
 */
export class ExecutionContextFactory {
  /**
   * Creates a new ExecutionContext instance.
   *
   * @param options - Context configuration options
   * @returns A new ExecutionContext instance
   */
  static create(options: ExecutionContextOptions): IExecutionContext {
    return new ExecutionContext(options);
  }

  /**
   * Creates an ExecutionContext with default script names.
   *
   * @param days - Number of days for the safety buffer
   * @param packageJsonPath - Optional custom path to package.json
   * @returns A new ExecutionContext instance with default scripts
   */
  static createWithDefaults(days: number, packageJsonPath?: string): IExecutionContext {
    const defaultScripts: ScriptOptions = {
      lint: "lint",
      typecheck: "typecheck",
      test: "test",
      build: "build",
    };

    return new ExecutionContext({
      days,
      scripts: defaultScripts,
      packageJsonPath,
    });
  }

  /**
   * Creates a minimal context for testing purposes.
   *
   * @param overrides - Partial context properties to override
   * @returns A mock context suitable for testing
   */
  static createMock(overrides: Partial<IExecutionContext> = {}): IExecutionContext {
    const defaultMock: IExecutionContext = {
      scripts: {},
      allDependencies: {},
      dependencies: {},
      devDependencies: {},
      raw: {},
      cutoff: new Date(),
      cutoffIso: new Date().toISOString(),
      days: 7,
      scriptNames: {
        lint: "lint",
        typecheck: "typecheck",
        test: "test",
        build: "build",
      },
      hasScript: () => false,
      hasPackage: () => false,
      getPackageVersion: () => undefined,
    };

    return { ...defaultMock, ...overrides };
  }
}
