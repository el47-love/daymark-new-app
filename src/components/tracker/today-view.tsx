import { Pencil, Plus, StickyNote } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckButton } from "@/components/tracker/check-button";
import { useTracker } from "@/components/tracker/context";
import { NoteDialog } from "@/components/tracker/note-dialog";
import { habitColor } from "@/lib/colors";
import { monthStart, weekStart } from "@/lib/dates";
import {
  completionInRange,
  currentStreak,
  formatPct,
  leadingStreak,
  longestStreak,
  rangeTotals,
  streakLabel,
  todayStatus,
} from "@/lib/stats";
import { cn } from "@/lib/utils";

export function TodayView({ onAdd }: { onAdd: () => void }) {
  const { today, habits, byHabit, notes, toggle, setNote, onEdit } = useTracker();
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const noteHabit = habits.find((habit) => habit.id === noteFor) ?? null;
  const doneToday = habits.filter((habit) => byHabit.get(habit.id)?.has(today)).length;
  const weekStartDate = weekStart(today);
  const week = rangeTotals(habits, byHabit, weekStartDate, today);
  const month = rangeTotals(habits, byHabit, monthStart(today), today);
  const best = longestStreak(habits, byHabit);
  const leader = leadingStreak(habits, byHabit, today);

  if (habits.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-line bg-elevated px-6 py-10 text-center">
        <h2 className="font-display text-2xl font-medium tracking-tight">Nothing on the list</h2>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
          Add a habit small enough to repeat. One line is enough to begin.
        </p>
        <Button className="mt-6" onClick={onAdd}>
          <Plus className="size-4" />
          Add a habit
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div aria-live="polite">
        <p className="font-display text-5xl font-medium tracking-tight tabular-nums">
          <span className={doneToday === habits.length ? "text-accent" : "text-fg"}>{doneToday}</span>
          <span className="text-2xl text-muted"> / {habits.length}</span>
        </p>
        <p className="mt-1 text-sm text-muted">{todayStatus(doneToday, habits.length)}</p>
        {leader && leader.days >= 3 ? (
          <p className="mt-1 text-sm text-fg">
            {leader.name} is at {leader.days} days.
          </p>
        ) : null}
      </div>
      <div
        className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface"
        role="meter"
        aria-valuenow={doneToday}
        aria-valuemin={0}
        aria-valuemax={habits.length}
        aria-label="Habits completed today"
      >
        <div
          className="bar-fill h-full rounded-full bg-accent"
          style={{ width: `${(doneToday / habits.length) * 100}%` }}
        />
      </div>
      <dl className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="This week" value={formatPct(week.done, week.total)} />
        <Stat label="This month" value={formatPct(month.done, month.total)} />
        <Stat label="Best streak" value={best > 0 ? `${best}d` : "—"} />
      </dl>
      <ul className="mt-6 flex flex-col gap-3">
        {habits.map((habit) => {
          const dates = byHabit.get(habit.id) ?? new Set<string>();
          const checked = dates.has(today);
          const streak = currentStreak(dates, today);
          const monthStat = completionInRange(dates, monthStart(today), today, habit.createdAt);
          return (
            <li
              key={habit.id}
              className="flex items-center gap-3 rounded-xl border border-line bg-elevated py-3 pr-3 pl-4"
            >
              <span className={cn("h-10 w-1 shrink-0 rounded-full", habitColor(habit.color).swatch)} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{habit.name}</p>
                {habit.note ? <p className="truncate text-sm text-muted">{habit.note}</p> : null}
                {checked && notes[`${habit.id}|${today}`] ? (
                  <p className="truncate text-sm text-fg/80 italic">“{notes[`${habit.id}|${today}`]}”</p>
                ) : null}
                <p className="text-sm text-muted tabular-nums">
                  {streakLabel(streak)}
                  {monthStat.total > 0 ? ` · ${formatPct(monthStat.done, monthStat.total)} this month` : ""}
                </p>
              </div>
              {checked ? (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Note for ${habit.name} today`}
                  onClick={() => setNoteFor(habit.id)}
                >
                  <StickyNote className="size-4" />
                </Button>
              ) : null}
              <Button variant="ghost" size="icon" aria-label={`Edit ${habit.name}`} onClick={() => onEdit(habit)}>
                <Pencil className="size-4" />
              </Button>
              <CheckButton
                checked={checked}
                color={habit.color}
                emphasized={!checked}
                label={checked ? `Unmark ${habit.name} for today` : `Mark ${habit.name} for today`}
                onClick={() => toggle(habit.id, today)}
              />
            </li>
          );
        })}
      </ul>
      <NoteDialog
        open={noteHabit !== null}
        habitName={noteHabit?.name ?? ""}
        date={today}
        initial={noteHabit ? (notes[`${noteHabit.id}|${today}`] ?? "") : ""}
        onOpenChange={(open) => {
          if (!open) setNoteFor(null);
        }}
        onSave={(text) => {
          if (noteHabit) setNote(noteHabit.id, today, text);
          setNoteFor(null);
        }}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-xs text-muted">{label}</dt>
      <dd className="mt-1 font-display text-2xl tabular-nums tracking-tight">{value}</dd>
    </div>
  );
}
