import type { SpawnSyncOptions } from "child_process";

/**
 * Standard spawn options for child processes
 */
export const SPAWN_OPTIONS: SpawnSyncOptions = {
  stdio: "inherit",
  shell: false,
} as const;
