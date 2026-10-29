import { createContext, useContext, useMemo, type ReactNode } from "react";
import { datesForHabit, useHabits } from "@/lib/store";
import type { CheckMap, Habit, NoteMap } from "@/lib/types";

type TrackerContextValue = {
  today: string;
  habits: Habit[]; // active habits only; paused and archived ones are hidden here
  checks: CheckMap;
  notes: NoteMap;
  byHabit: Map<string, Set<string>>;
  toggle: (habitId: string, date: string) => void;
  setNote: (habitId: string, date: string, text: string) => void;
  onEdit: (habit: Habit) => void;
};

const TrackerContext = createContext<TrackerContextValue | null>(null);

export function TrackerProvider({
  today,
  onEdit,
  children,
}: {
  today: string;
  onEdit: (habit: Habit) => void;
  children: ReactNode;
}) {
  const allHabits = useHabits((state) => state.habits);
  const checks = useHabits((state) => state.checks);
  const notes = useHabits((state) => state.notes);
  const toggle = useHabits((state) => state.toggle);
  const setNote = useHabits((state) => state.setNote);

  const habits = useMemo(
    () => allHabits.filter((habit) => habit.status === "active"),
    [allHabits],
  );

  const byHabit = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const habit of habits) map.set(habit.id, datesForHabit(checks, habit.id));
    return map;
  }, [habits, checks]);

  const value = useMemo(
    () => ({ today, habits, checks, notes, byHabit, toggle, setNote, onEdit }),
    [today, habits, checks, notes, byHabit, toggle, setNote, onEdit],
  );

  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>;
}

export function useTracker(): TrackerContextValue {
  const value = useContext(TrackerContext);
  if (!value) throw new Error("Tracker context missing");
  return value;
}
