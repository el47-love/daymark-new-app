import type { HabitColor } from "@/lib/colors";

export type HabitStatus = "active" | "paused" | "archived";

export type Habit = {
  id: string;
  name: string;
  note: string;
  color: HabitColor;
  createdAt: string;
  status: HabitStatus;
};

export type CheckMap = Record<string, true>;

// Keyed like checks ("habitId|YYYY-MM-DD"); only exists on checked days.
export type NoteMap = Record<string, string>;

export type HabitInput = {
  name: string;
  note: string;
  color: HabitColor;
};
