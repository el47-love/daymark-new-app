import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { HabitDialog } from "@/components/tracker/habit-dialog";
import { MonthView } from "@/components/tracker/month-view";
import { TrackerProvider } from "@/components/tracker/context";
import { useReminderWatcher } from "@/components/tracker/reminder-watcher";
import { SettingsView } from "@/components/tracker/settings-view";
import { TodayView } from "@/components/tracker/today-view";
import { WeekView } from "@/components/tracker/week-view";
import { nextColor } from "@/lib/colors";
import { formatLong, todayISO } from "@/lib/dates";
import { startHydration, useHabits } from "@/lib/store";
import type { Habit, HabitInput } from "@/lib/types";
import { cn } from "@/lib/utils";

type View = "today" | "week" | "month" | "settings";

const VIEWS: { id: View; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "settings", label: "Settings" },
];

export function TrackerApp() {
  const ready = useHabits((state) => state.ready);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    startHydration();
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="h-1 bg-accent" aria-hidden />
      <main className="page-wrap mx-auto w-full max-w-3xl px-4 pt-8 sm:px-6 sm:pt-12">
        {mounted && ready ? <Live /> : <ShellSkeleton />}
      </main>
    </div>
  );
}

function Live() {
  const habits = useHabits((state) => state.habits);
  const addHabit = useHabits((state) => state.addHabit);
  const updateHabit = useHabits((state) => state.updateHabit);
  const removeHabit = useHabits((state) => state.removeHabit);
  const [today, setToday] = useState(todayISO);
  const [view, setView] = useState<View>("today");
  const [cursor, setCursor] = useState(today);
  const [draft, setDraft] = useState<null | { mode: "create" } | { mode: "edit"; id: string }>(null);

  useEffect(() => {
    const sync = () => setToday(todayISO());
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  useReminderWatcher(today);

  const editing = draft?.mode === "edit" ? (habits.find((habit) => habit.id === draft.id) ?? null) : null;
  const activeHabits = useMemo(() => habits.filter((habit) => habit.status === "active"), [habits]);

  function onEdit(habit: Habit) {
    setDraft({ mode: "edit", id: habit.id });
  }

  function onSave(input: HabitInput) {
    if (draft?.mode === "edit" && editing) updateHabit(editing.id, input);
    else addHabit(input);
    setDraft(null);
  }

  return (
    <TrackerProvider today={today} onEdit={onEdit}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-4xl font-medium tracking-tight">Daymark</h1>
          <p className="mt-1 text-sm text-muted">{formatLong(today)}</p>
        </div>
        {habits.length > 0 ? (
          <Button variant="secondary" className="mt-1 shrink-0" onClick={() => setDraft({ mode: "create" })}>
            <Plus className="size-4" />
            Add
          </Button>
        ) : null}
      </div>

      <div className="mt-6 grid grid-cols-4 gap-1 rounded-lg bg-surface p-1" role="tablist" aria-label="Range">
        {VIEWS.map((item) => {
          const selected = view === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={cn(
                "motion-colors h-11 rounded-md text-sm font-medium",
                selected ? "bg-elevated text-fg" : "text-muted hover:text-fg",
              )}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        {view === "today" ? <TodayView onAdd={() => setDraft({ mode: "create" })} /> : null}
        {view === "week" ? <WeekView cursor={cursor} onCursor={setCursor} /> : null}
        {view === "month" ? <MonthView cursor={cursor} onCursor={setCursor} /> : null}
        {view === "settings" ? <SettingsView habits={habits} onEdit={onEdit} /> : null}
      </div>

      <p className="mt-10 text-center text-xs text-muted">Saved on this device.</p>

      <HabitDialog
        open={draft !== null && (draft.mode === "create" || editing !== null)}
        mode={draft?.mode ?? "create"}
        habit={editing}
        defaultColor={nextColor(activeHabits.map((habit) => habit.color))}
        onOpenChange={(open) => {
          if (!open) setDraft(null);
        }}
        onSave={onSave}
        onDelete={() => {
          if (editing) removeHabit(editing.id);
          setDraft(null);
        }}
      />
    </TrackerProvider>
  );
}

function ShellSkeleton() {
  return (
    <div>
      <h1 className="font-display text-4xl font-medium tracking-tight">Daymark</h1>
      <div className="mt-3 h-4 w-44 animate-pulse rounded-md bg-surface" />
      <div className="mt-6 h-12 animate-pulse rounded-lg bg-surface" />
      <div className="mt-6 h-24 animate-pulse rounded-xl bg-surface" />
      <div className="mt-3 h-20 animate-pulse rounded-xl bg-surface" />
      <div className="mt-3 h-20 animate-pulse rounded-xl bg-surface" />
    </div>
  );
}
