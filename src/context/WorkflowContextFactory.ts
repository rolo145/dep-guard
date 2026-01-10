/**
 * Workflow Context Factory
 *
 * Factory for creating WorkflowContext instances. Provides a clean API
 * for context creation and supports different creation strategies.
 *
 * @module context/WorkflowContextFactory
 */
import type { ScriptOptions } from "../args/types";
import type { IWorkflowContext } from "./IWorkflowContext";
import { WorkflowContext, type WorkflowContextOptions } from "./WorkflowContext";

/**
 * Factory for creating WorkflowContext instances.
 *
 * Supports standard creation and custom configurations for testing.
 *
 * @example
 * ```typescript
 * // Standard usage
 * const context = WorkflowContextFactory.create({
 *   days: 7,
 *   scripts: { lint: 'lint', typecheck: 'typecheck', test: 'test', build: 'build' }
 * });
 *
 * // For testing with custom package.json path
 * const testContext = WorkflowContextFactory.create({
 *   days: 7,
 *   scripts,
 *   packageJsonPath: './fixtures/package.json'
 * });
 * ```
 */
export class WorkflowContextFactory {
  /**
   * Creates a new WorkflowContext instance.
   *
   * @param options - Context configuration options
   * @returns A new WorkflowContext instance
   */
  static create(options: WorkflowContextOptions): IWorkflowContext {
    return new WorkflowContext(options);
  }

  /**
   * Creates a WorkflowContext with default script names.
   *
   * @param days - Number of days for the safety buffer
   * @param packageJsonPath - Optional custom path to package.json
   * @returns A new WorkflowContext instance with default scripts
   */
  static createWithDefaults(days: number, packageJsonPath?: string): IWorkflowContext {
    const defaultScripts: ScriptOptions = {
      lint: "lint",
      typecheck: "typecheck",
      test: "test",
      build: "build",
    };

    return new WorkflowContext({
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
  static createMock(overrides: Partial<IWorkflowContext> = {}): IWorkflowContext {
    const defaultMock: IWorkflowContext = {
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
