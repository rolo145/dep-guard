/**
 * Command Execution Utilities
 *
 * Provides utilities for executing external commands.
 *
 * @module utils/command
 */
import { type SpawnSyncOptions } from "child_process";
import spawn from "cross-spawn";

/**
 * Standard spawn options for child processes.
 *
 * Note: commands are spawned via cross-spawn, which resolves platform-specific
 * launchers (e.g. `npm.cmd` on Windows) without a shell. This keeps argument
 * passing literal and injection-safe across platforms — do not add `shell: true`.
 */
const SPAWN_OPTIONS: SpawnSyncOptions = {
  stdio: "inherit",
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
  const result = spawn.sync(cmd, args, options);
  if (result.error) {
    throw new Error(`Failed to spawn "${cmd}": ${result.error.message}`);
  }
  return result.status === 0;
}

/**
 * Runs a command synchronously and captures its output
 * @param cmd - command to execute
 * @param args - command arguments
 * @returns success status and captured stdout+stderr text
 */
export function runWithOutput(cmd: string, args: string[]): { success: boolean; output: string } {
  const result = spawn.sync(cmd, args, { stdio: "pipe", encoding: "utf-8" });

  if (result.error) {
    throw new Error(`Failed to spawn "${cmd}": ${result.error.message}`);
  }

  const stdout = (result.stdout as string) || "";
  const stderr = (result.stderr as string) || "";
  const output = [stdout, stderr].filter(Boolean).join("\n").trim();
  return {
    success: result.status === 0,
    output,
  };
}
