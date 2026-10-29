import { eachDate } from "@/lib/dates";
import type { Habit } from "@/lib/types";

export type DayState = "inactive" | "future" | "done" | "today" | "open";

export function dayState(options: {
  date: string;
  today: string;
  createdAt: string;
  checked: boolean;
}): DayState {
  if (options.date < options.createdAt) return "inactive";
  if (options.date > options.today) return "future";
  if (options.checked) return "done";
  if (options.date === options.today) return "today";
  return "open";
}

// Today stays open: the streak holds through yesterday until the day is over.
export function currentStreak(done: Set<string>, today: string): number {
  const start = done.has(today) ? today : shift(today, -1);
  let cursor = start;
  let count = 0;
  while (done.has(cursor) && count < 10000) {
    count += 1;
    cursor = shift(cursor, -1);
  }
  return count;
}

export function bestStreak(done: Set<string>): number {
  if (done.size === 0) return 0;
  const days = [...done].sort();
  let best = 1;
  let run = 1;
  for (let index = 1; index < days.length; index += 1) {
    const gap = diffDays(days[index - 1] ?? "", days[index] ?? "");
    if (gap === 1) {
      run += 1;
      if (run > best) best = run;
    } else if (gap > 1) {
      run = 1;
    }
  }
  return best;
}

export function completionInRange(
  done: Set<string>,
  from: string,
  to: string,
  createdAt: string,
): { done: number; total: number } {
  const start = createdAt > from ? createdAt : from;
  if (start > to) return { done: 0, total: 0 };
  let total = 0;
  let count = 0;
  for (const day of eachDate(start, to)) {
    total += 1;
    if (done.has(day)) count += 1;
  }
  return { done: count, total };
}

export function formatPct(done: number, total: number): string {
  if (total <= 0) return "—";
  return `${Math.round((done / total) * 100)}%`;
}

export function streakLabel(days: number): string {
  if (days <= 0) return "No streak";
  if (days === 1) return "1 day";
  return `${days} days`;
}

export function todayStatus(done: number, total: number): string {
  if (total === 0) return "Add a habit small enough to keep.";
  if (done === 0) return "A fresh day. Mark the first one.";
  if (done === total) return "Every habit is marked.";
  const left = total - done;
  return left === 1 ? "One habit left today." : `${left} habits left today.`;
}

export function rangeTotals(
  habits: readonly Habit[],
  byHabit: ReadonlyMap<string, Set<string>>,
  from: string,
  to: string,
): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const habit of habits) {
    const result = completionInRange(byHabit.get(habit.id) ?? new Set(), from, to, habit.createdAt);
    done += result.done;
    total += result.total;
  }
  return { done, total };
}

export function longestStreak(
  habits: readonly Habit[],
  byHabit: ReadonlyMap<string, Set<string>>,
): number {
  let best = 0;
  for (const habit of habits) {
    const streak = bestStreak(byHabit.get(habit.id) ?? new Set());
    if (streak > best) best = streak;
  }
  return best;
}

export function leadingStreak(
  habits: readonly Habit[],
  byHabit: ReadonlyMap<string, Set<string>>,
  today: string,
): { name: string; days: number } | null {
  let leader: { name: string; days: number } | null = null;
  for (const habit of habits) {
    const days = currentStreak(byHabit.get(habit.id) ?? new Set(), today);
    if (!leader || days > leader.days) leader = { name: habit.name, days };
  }
  if (!leader || leader.days <= 0) return null;
  return leader;
}

function shift(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function diffDays(from: string, to: string): number {
  const a = shift(from, 0);
  const b = shift(to, 0);
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const start = Date.UTC(ay ?? 1970, (am ?? 1) - 1, ad ?? 1);
  const end = Date.UTC(by ?? 1970, (bm ?? 1) - 1, bd ?? 1);
  return Math.round((end - start) / 86400000);
}
