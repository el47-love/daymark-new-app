import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { todayISO } from "@/lib/dates";
import { buildSeed } from "@/lib/seed";
import { NOTE_MAX, normalizeState, type Persisted } from "@/lib/persist-state";
import type { HabitStatus, HabitInput, Habit } from "@/lib/types";

type Store = Persisted & {
  ready: boolean;
  addHabit: (input: HabitInput) => void;
  updateHabit: (id: string, input: HabitInput) => void;
  removeHabit: (id: string) => void;
  setStatus: (id: string, status: HabitStatus) => void;
  moveHabit: (id: string, direction: -1 | 1) => void;
  toggle: (habitId: string, date: string) => void;
  setNote: (habitId: string, date: string, text: string) => void;
  replaceAll: (data: Persisted) => void;
};

const emptyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

function checkKey(habitId: string, date: string): string {
  return `${habitId}|${date}`;
}

function withoutPrefix<T>(record: Record<string, T>, prefix: string): Record<string, T> {
  const next: Record<string, T> = {};
  for (const [key, value] of Object.entries(record)) {
    if (!key.startsWith(prefix)) next[key] = value;
  }
  return next;
}

export const useHabits = create<Store>()(
  persist(
    (set) => ({
      habits: [],
      checks: {},
      notes: {},
      initialized: false,
      ready: false,
      addHabit: (input) => {
        const name = input.name.trim().slice(0, 48);
        if (!name) return;
        const habit: Habit = {
          id: crypto.randomUUID(),
          name,
          note: input.note.trim().slice(0, 80),
          color: input.color,
          createdAt: todayISO(),
          status: "active",
        };
        set((state) => ({ habits: [...state.habits, habit] }));
      },
      updateHabit: (id, input) => {
        const name = input.name.trim().slice(0, 48);
        if (!name) return;
        set((state) => ({
          habits: state.habits.map((habit) =>
            habit.id === id
              ? { ...habit, name, note: input.note.trim().slice(0, 80), color: input.color }
              : habit,
          ),
        }));
      },
      removeHabit: (id) => {
        const prefix = `${id}|`;
        set((state) => ({
          habits: state.habits.filter((habit) => habit.id !== id),
          checks: withoutPrefix(state.checks, prefix),
          notes: withoutPrefix(state.notes, prefix),
        }));
      },
      setStatus: (id, status) => {
        set((state) => ({
          habits: state.habits.map((habit) => (habit.id === id ? { ...habit, status } : habit)),
        }));
      },
      moveHabit: (id, direction) => {
        set((state) => {
          const habit = state.habits.find((item) => item.id === id);
          if (!habit) return state;
          // Reorder within the habit's own status group, swapping with its neighbour.
          const group = state.habits.filter((item) => item.status === habit.status);
          const neighbor = group[group.findIndex((item) => item.id === id) + direction];
          if (!neighbor) return state;
          const habits = [...state.habits];
          const from = habits.indexOf(habit);
          const to = habits.indexOf(neighbor);
          habits[from] = neighbor;
          habits[to] = habit;
          return { habits };
        });
      },
      toggle: (habitId, date) => {
        if (date > todayISO()) return;
        const key = checkKey(habitId, date);
        set((state) => {
          const habit = state.habits.find((item) => item.id === habitId);
          if (!habit) return state;
          const checks = { ...state.checks };
          const notes = { ...state.notes };
          let habits = state.habits;
          if (checks[key]) {
            delete checks[key];
            delete notes[key];
          } else {
            checks[key] = true;
            if (date < habit.createdAt) {
              habits = habits.map((item) =>
                item.id === habitId ? { ...item, createdAt: date } : item,
              );
            }
          }
          return { checks, notes, habits };
        });
      },
      setNote: (habitId, date, text) => {
        const key = checkKey(habitId, date);
        const trimmed = text.trim().slice(0, NOTE_MAX);
        set((state) => {
          if (!state.checks[key]) return state;
          const notes = { ...state.notes };
          if (trimmed) notes[key] = trimmed;
          else delete notes[key];
          return { notes };
        });
      },
      replaceAll: (data) => {
        set({
          habits: data.habits,
          checks: data.checks,
          notes: data.notes,
          initialized: true,
          ready: true,
        });
      },
    }),
    {
      name: "daymark-v1",
      skipHydration: true,
      version: 1,
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? emptyStorage : localStorage,
      ),
      partialize: (state) => ({
        habits: state.habits,
        checks: state.checks,
        notes: state.notes,
        initialized: state.initialized,
      }),
    },
  ),
);

let started = false;

export function startHydration() {
  if (started) return;
  started = true;
  const finish = () => {
    const clean = normalizeState(useHabits.getState());
    if (!clean.initialized) {
      useHabits.setState({ ...normalizeState({ ...buildSeed(new Date()), initialized: true }), ready: true });
      return;
    }
    useHabits.setState({ ...clean, ready: true });
  };
  const pending = useHabits.persist.rehydrate();
  if (pending) void pending.then(finish, finish);
  else finish();
}

export function datesForHabit(checks: Record<string, true>, habitId: string): Set<string> {
  const dates = new Set<string>();
  const prefix = `${habitId}|`;
  for (const key of Object.keys(checks)) {
    if (key.startsWith(prefix)) dates.add(key.slice(prefix.length));
  }
  return dates;
}
