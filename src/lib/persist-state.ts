import { isHabitColor } from "./colors.ts";
import type { CheckMap, Habit, HabitStatus, NoteMap } from "./types.ts";

export type Persisted = {
  habits: Habit[];
  checks: CheckMap;
  notes: NoteMap;
  initialized: boolean;
};

export const NOTE_MAX = 280;
const STATUSES: readonly HabitStatus[] = ["active", "paused", "archived"];

// Accepts anything (stored JSON, an imported backup) and returns a clean state.
export function normalizeState(input: unknown): Persisted {
  const source: Record<string, unknown> =
    input && typeof input === "object" ? (input as Record<string, unknown>) : {};

  const rawHabits = Array.isArray(source.habits) ? source.habits : [];
  const habits: Habit[] = rawHabits.flatMap((item): Habit[] => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Record<string, unknown>;
    if (typeof candidate.id !== "string" || typeof candidate.name !== "string") return [];
    if (typeof candidate.createdAt !== "string") return [];
    const status = STATUSES.find((value) => value === candidate.status) ?? "active";
    return [
      {
        id: candidate.id,
        name: candidate.name.trim().slice(0, 48),
        note: typeof candidate.note === "string" ? candidate.note.slice(0, 80) : "",
        color: isHabitColor(candidate.color as string) ? (candidate.color as Habit["color"]) : "pine",
        createdAt: candidate.createdAt,
        status,
      },
    ];
  });

  const checks: CheckMap = {};
  if (source.checks && typeof source.checks === "object") {
    for (const [key, value] of Object.entries(source.checks)) {
      if (value && key.includes("|")) checks[key] = true;
    }
  }

  const notes: NoteMap = {};
  if (source.notes && typeof source.notes === "object") {
    for (const [key, value] of Object.entries(source.notes)) {
      if (typeof value !== "string" || !checks[key]) continue;
      const text = value.trim().slice(0, NOTE_MAX);
      if (text) notes[key] = text;
    }
  }

  return { habits, checks, notes, initialized: Boolean(source.initialized) };
}
