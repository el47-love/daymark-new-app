import { Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTracker } from "@/components/tracker/context";
import { PeriodNav } from "@/components/tracker/period-nav";
import { habitColor } from "@/lib/colors";
import {
  WEEKDAY_NARROW,
  addDaysISO,
  dayOfMonth,
  formatLong,
  formatWeekRange,
  weekDays,
  weekStart,
  weekdayIndexMonday,
} from "@/lib/dates";
import { currentStreak, dayState, rangeTotals, streakLabel, type DayState } from "@/lib/stats";
import type { Habit } from "@/lib/types";
import { cn } from "@/lib/utils";

export function WeekView({
  cursor,
  onCursor,
}: {
  cursor: string;
  onCursor: (iso: string) => void;
}) {
  const { today, habits, byHabit } = useTracker();
  const start = weekStart(cursor);
  const days = weekDays(cursor);
  const end = days[6] ?? start;
  const cappedEnd = end < today ? end : today;
  const totals = rangeTotals(habits, byHabit, start, cappedEnd);
  const detail =
    totals.total === 0 ? "No habits in this range" : `${totals.done} of ${totals.total} marked`;
  const onThisWeek = start === weekStart(today);

  return (
    <div className="mt-6">
      <PeriodNav
        label={formatWeekRange(start)}
        detail={detail}
        onPrev={() => onCursor(addDaysISO(start, -7))}
        onNext={() => onCursor(addDaysISO(start, 7))}
        canNext={addDaysISO(start, 7) <= today}
        prevLabel="Previous week"
        nextLabel="Next week"
        showJump={!onThisWeek}
        jumpLabel="Back to this week"
        onJump={() => onCursor(today)}
      />
      {habits.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Add a habit to start filling the week.</p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-line bg-elevated">
          <div className="grid grid-cols-7 gap-1 border-b border-line px-3 py-2">
            {days.map((date) => {
              const isToday = date === today;
              return (
                <div key={date} className="text-center">
                  <p className={cn("text-xs", isToday ? "font-medium text-fg" : "text-muted")}>
                    {WEEKDAY_NARROW[weekdayIndexMonday(date)]}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 hidden text-xs tabular-nums sm:block",
                      isToday ? "text-fg" : "text-subtle",
                    )}
                  >
                    {dayOfMonth(date)}
                  </p>
                </div>
              );
            })}
          </div>
          {habits.map((habit, index) => (
            <HabitWeek key={habit.id} habit={habit} days={days} divided={index > 0} />
          ))}
        </div>
      )}
    </div>
  );
}

function HabitWeek({ habit, days, divided }: { habit: Habit; days: string[]; divided: boolean }) {
  const { today, byHabit, toggle, onEdit } = useTracker();
  const dates = byHabit.get(habit.id) ?? new Set<string>();
  const streak = currentStreak(dates, today);

  return (
    <section className={cn("p-3", divided && "border-t border-line")}>
      <div className="mb-2 flex items-center gap-2">
        <span className={cn("size-2.5 shrink-0 rounded-full", habitColor(habit.color).swatch)} aria-hidden />
        <p className="min-w-0 flex-1 truncate font-medium">{habit.name}</p>
        <p className="shrink-0 text-sm text-muted tabular-nums">{streakLabel(streak)}</p>
        <Button variant="ghost" size="icon" aria-label={`Edit ${habit.name}`} onClick={() => onEdit(habit)}>
          <Pencil className="size-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((date) => (
          <DayCell
            key={date}
            habit={habit}
            date={date}
            state={dayState({
              date,
              today,
              createdAt: habit.createdAt,
              checked: dates.has(date),
            })}
            onToggle={() => toggle(habit.id, date)}
          />
        ))}
      </div>
    </section>
  );
}

function DayCell({
  habit,
  date,
  state,
  onToggle,
}: {
  habit: Habit;
  date: string;
  state: DayState;
  onToggle: () => void;
}) {
  if (state === "inactive") {
    return <div className="min-h-11 w-full" aria-hidden />;
  }
  const checked = state === "done";
  return (
    <button
      type="button"
      disabled={state === "future"}
      aria-pressed={state === "future" ? undefined : checked}
      aria-label={`${checked ? "Unmark" : "Mark"} ${habit.name} for ${formatLong(date)}`}
      onClick={onToggle}
      className={cn(
        "pressable motion-colors flex aspect-square w-full items-center justify-center rounded-md border",
        state === "done" && cn(habitColor(habit.color).swatch, "border-transparent text-accent-fg"),
        state === "today" && "border-accent bg-elevated text-muted",
        state === "open" && "border-line bg-elevated text-muted hover:bg-surface",
        state === "future" && "border-line bg-bg text-subtle",
      )}
    >
      <Check className={cn("size-4", checked ? "opacity-100" : "opacity-0")} strokeWidth={2.5} />
    </button>
  );
}
