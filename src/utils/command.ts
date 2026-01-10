/**
 * Command Execution Utilities
 *
 * Provides utilities for executing external commands.
 *
 * @module utils/command
 */
import {
  spawnSync,
  type SpawnSyncOptions,
} from "child_process";

/**
 * Standard spawn options for child processes
 */
const SPAWN_OPTIONS: SpawnSyncOptions = {
  stdio: "inherit",
  shell: false,
} as const;

/**
 * Runs a command synchronously and returns success/failure (doesn't exit on failure)
 * @param cmd - command to execute
 * @param args - command arguments
 * @param options - spawn options (defaults to SPAWN_OPTIONS)
 * @returns true if command succeeded (exit code 0), false otherwise
 */
export function tryRunCommand(
  cmd: string,
  args: string[],
  options: SpawnSyncOptions = SPAWN_OPTIONS,
): boolean {
  const result = spawnSync(cmd, args, options);
  return result.status === 0;
}
