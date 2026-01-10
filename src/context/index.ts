/**
 * Context Module
 *
 * Provides execution runtime context and state management.
 *
 * @module context
 */
export { ExecutionContext, type ExecutionContextOptions } from "./ExecutionContext";
export { ExecutionContextFactory } from "./ExecutionContextFactory";
export type { IExecutionContext } from "./IExecutionContext";
export { PackageJsonReader, type PackageJson } from "./PackageJsonReader";
