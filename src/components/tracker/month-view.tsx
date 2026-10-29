import { Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { CheckButton } from "@/components/tracker/check-button";
import { useTracker } from "@/components/tracker/context";
import { PeriodNav } from "@/components/tracker/period-nav";
import { habitColor } from "@/lib/colors";
import {
  WEEKDAY_NARROW,
  WEEKDAY_SHORT,
  formatLong,
  formatMonthName,
  formatMonthYear,
  monthCells,
  monthEnd,
  monthStart,
  shiftMonth,
} from "@/lib/dates";
import {
  bestStreak,
  completionInRange,
  currentStreak,
  formatPct,
  rangeTotals,
  streakLabel,
} from "@/lib/stats";
import type { Habit } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MonthView({
  cursor,
  onCursor,
}: {
  cursor: string;
  onCursor: (iso: string) => void;
}) {
  const { today, habits, checks, byHabit, toggle } = useTracker();
  const [openDate, setOpenDate] = useState<string | null>(null);
  const start = monthStart(cursor);
  const end = monthEnd(cursor);
  const cappedEnd = end < today ? end : today;
  const totals = rangeTotals(habits, byHabit, start, cappedEnd);
  const cells = monthCells(cursor);
  const onThisMonth = monthStart(cursor) === monthStart(today);
  const monthName = formatMonthName(cursor);

  const fullDays = useMemo(() => {
    let count = 0;
    for (const date of cells) {
      if (!date || date > today) continue;
      const active = habits.filter((habit) => habit.createdAt <= date);
      if (active.length === 0) continue;
      const done = active.filter((habit) => checks[`${habit.id}|${date}`]).length;
      if (done === active.length) count += 1;
    }
    return count;
  }, [cells, checks, habits, today]);

  return (
    <div className="mt-6">
      <PeriodNav
        label={formatMonthYear(cursor)}
        detail={totals.total === 0 ? "No habits in this range" : `${totals.done} of ${totals.total} marked`}
        onPrev={() => onCursor(shiftMonth(cursor, -1))}
        onNext={() => onCursor(shiftMonth(cursor, 1))}
        canNext={shiftMonth(cursor, 1) <= today}
        prevLabel="Previous month"
        nextLabel="Next month"
        showJump={!onThisMonth}
        jumpLabel="Back to this month"
        onJump={() => onCursor(today)}
      />

      {habits.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Add a habit to start the month.</p>
      ) : (
        <>
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            {habits.map((habit) => (
              <li key={habit.id} className="flex max-w-full items-center gap-2 text-sm">
                <span className={cn("size-2.5 shrink-0 rounded-full", habitColor(habit.color).swatch)} aria-hidden />
                <span className="truncate">{habit.name}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-xl border border-line bg-elevated p-3">
            <div className="mb-2 grid grid-cols-7 gap-1">
              {WEEKDAY_NARROW.map((label, index) => (
                <p key={WEEKDAY_SHORT[index]} className="text-center text-xs text-muted">
                  <span className="sm:hidden">{label}</span>
                  <span className="hidden sm:inline">{WEEKDAY_SHORT[index]}</span>
                </p>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((date, index) =>
                date ? (
                  <MonthCell
                    key={date}
                    date={date}
                    habits={habits}
                    checks={checks}
                    today={today}
                    onOpen={() => setOpenDate(date)}
                  />
                ) : (
                  <div key={`empty-${index}`} />
                ),
              )}
            </div>
          </div>
          <p className="mt-3 text-sm text-muted tabular-nums">
            {fullDays} full {fullDays === 1 ? "day" : "days"}
            {onThisMonth ? " so far" : ` in ${monthName}`}
          </p>

          <h2 className="mt-8 font-display text-2xl font-medium tracking-tight">By habit</h2>
          <p className="mt-1 text-sm text-muted">Streaks, and how much of {monthName} is kept.</p>
          <div className="mt-4 overflow-hidden rounded-xl border border-line bg-elevated">
            {habits.map((habit, index) => (
              <HabitMonthStat key={habit.id} habit={habit} cursor={cursor} divided={index > 0} />
            ))}
          </div>
        </>
      )}

      <DaySheet
        date={openDate}
        onOpenChange={(open) => {
          if (!open) setOpenDate(null);
        }}
        onToggle={toggle}
      />
    </div>
  );
}

function MonthCell({
  date,
  habits,
  checks,
  today,
  onOpen,
}: {
  date: string;
  habits: Habit[];
  checks: Record<string, true>;
  today: string;
  onOpen: () => void;
}) {
  const isFuture = date > today;
  const isToday = date === today;
  const active = habits.filter((habit) => habit.createdAt <= date);
  const doneHabits = active.filter((habit) => checks[`${habit.id}|${date}`]);
  const ratio = active.length === 0 ? 0 : doneHabits.length / active.length;
  const shown = doneHabits.slice(0, 4);
  const extra = doneHabits.length - shown.length;
  const label = isFuture
    ? formatLong(date)
    : `${formatLong(date)}, ${doneHabits.length} of ${active.length} marked`;

  const className = cn(
    "flex aspect-square w-full flex-col items-center justify-between overflow-hidden rounded-md border p-1",
    isFuture && "border-transparent text-muted",
    !isFuture && ratio === 1 && "border-line bg-accent/10",
    !isFuture && ratio > 0 && ratio < 1 && "border-line bg-surface",
    !isFuture && ratio === 0 && "border-line bg-elevated",
    isToday && "border-accent",
  );

  const body = (
    <>
      <span className="text-xs leading-none tabular-nums">{Number(date.slice(8))}</span>
      <span className="flex max-w-full flex-wrap justify-center gap-0.5">
        {shown.map((habit) => (
          <span
            key={habit.id}
            className={cn("size-1.5 rounded-full sm:size-2", habitColor(habit.color).swatch)}
            aria-hidden
          />
        ))}
        {extra > 0 ? <span className="text-xs leading-none text-muted">+{extra}</span> : null}
      </span>
    </>
  );

  if (isFuture) {
    return (
      <div className={className} aria-hidden>
        {body}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={cn(className, "pressable motion-colors hover:border-line-strong")}
      onClick={onOpen}
      aria-current={isToday ? "date" : undefined}
      aria-label={label}
    >
      {body}
    </button>
  );
}

function HabitMonthStat({
  habit,
  cursor,
  divided,
}: {
  habit: Habit;
  cursor: string;
  divided: boolean;
}) {
  const { today, byHabit, onEdit } = useTracker();
  const dates = byHabit.get(habit.id) ?? new Set<string>();
  const end = monthEnd(cursor) < today ? monthEnd(cursor) : today;
  const month = completionInRange(dates, monthStart(cursor), end, habit.createdAt);
  const all = completionInRange(dates, habit.createdAt, today, habit.createdAt);
  const current = currentStreak(dates, today);
  const best = bestStreak(dates);
  const width = month.total === 0 ? 0 : Math.round((month.done / month.total) * 100);
  const monthName = formatMonthName(cursor);

  return (
    <div className={cn("flex items-start gap-3 p-3", divided && "border-t border-line")}>
      <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", habitColor(habit.color).swatch)} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate font-medium">{habit.name}</p>
          <p className="shrink-0 text-sm text-muted tabular-nums">{streakLabel(current)}</p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface" aria-hidden>
          <div className={cn("bar-fill h-full rounded-full", habitColor(habit.color).swatch)} style={{ width: `${width}%` }} />
        </div>
        <p className="mt-2 text-sm text-muted tabular-nums">
          {month.total === 0 ? `Not in ${monthName}` : `${month.done} of ${month.total} in ${monthName}`}
          {" · "}
          Best {best === 1 ? "1 day" : `${best} days`}
          {" · "}
          All time {formatPct(all.done, all.total)}
        </p>
      </div>
      <Button variant="ghost" size="icon" aria-label={`Edit ${habit.name}`} onClick={() => onEdit(habit)}>
        <Pencil className="size-4" />
      </Button>
    </div>
  );
}

function DaySheet({
  date,
  onOpenChange,
  onToggle,
}: {
  date: string | null;
  onOpenChange: (open: boolean) => void;
  onToggle: (habitId: string, date: string) => void;
}) {
  const { habits, checks, today } = useTracker();
  const done = date ? habits.filter((habit) => checks[`${habit.id}|${date}`]).length : 0;

  return (
    <Modal
      open={date !== null}
      onOpenChange={onOpenChange}
      title={date ? formatLong(date) : "Day"}
      description={
        date && date <= today
          ? `${done} of ${habits.length} marked. You can still change this day.`
          : "Habits for this day."
      }
    >
      <ul className="flex flex-col gap-2">
        {habits.map((habit) => {
          const checked = date ? Boolean(checks[`${habit.id}|${date}`]) : false;
          return (
            <li key={habit.id} className="flex items-center gap-3 rounded-md border border-line bg-bg px-3 py-2">
              <span className={cn("size-2.5 shrink-0 rounded-full", habitColor(habit.color).swatch)} aria-hidden />
              <p className="min-w-0 flex-1 truncate font-medium">{habit.name}</p>
              {date ? (
                <CheckButton
                  checked={checked}
                  color={habit.color}
                  emphasized={date === today && !checked}
                  label={`${checked ? "Unmark" : "Mark"} ${habit.name} for ${formatLong(date)}`}
                  onClick={() => onToggle(habit.id, date)}
                />
              ) : null}
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
