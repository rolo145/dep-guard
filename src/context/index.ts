/**
 * Context Module
 *
 * Provides workflow runtime context and state management.
 *
 * @module context
 */
export { WorkflowContext, type WorkflowContextOptions } from "./WorkflowContext";
export { WorkflowContextFactory } from "./WorkflowContextFactory";
export type { IWorkflowContext } from "./IWorkflowContext";
export { PackageJsonReader, type PackageJson } from "./PackageJsonReader";
