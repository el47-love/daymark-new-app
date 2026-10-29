import { normalizeState, type Persisted } from "./persist-state.ts";

export const BACKUP_FORMAT = "daymark-backup";
export const BACKUP_VERSION = 1;

export function buildBackup(state: Persisted, now: Date): string {
  return JSON.stringify(
    {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: now.toISOString(),
      habits: state.habits,
      checks: state.checks,
      notes: state.notes,
    },
    null,
    2,
  );
}

export function parseBackup(text: string): Persisted {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("That file isn't valid JSON, so it can't be a Daymark backup.");
  }
  if (!data || typeof data !== "object") throw new Error("That file isn't a Daymark backup.");
  const record = data as Record<string, unknown>;
  if (record.format !== BACKUP_FORMAT || !Array.isArray(record.habits)) {
    throw new Error("That file isn't a Daymark backup.");
  }
  if (typeof record.version === "number" && record.version > BACKUP_VERSION) {
    throw new Error("This backup was made by a newer version of Daymark.");
  }
  return normalizeState({
    habits: record.habits,
    checks: record.checks,
    notes: record.notes,
    initialized: true,
  });
}
