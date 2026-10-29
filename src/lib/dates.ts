export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function addDaysISO(iso: string, days: number): string {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function dayOfMonth(iso: string): number {
  return parseISODate(iso).getDate();
}

export function weekdayIndexMonday(iso: string): number {
  return (parseISODate(iso).getDay() + 6) % 7;
}

export const WEEKDAY_NARROW = ["M", "T", "W", "T", "F", "S", "S"] as const;
export const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const longFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});
const monthYearFmt = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const monthNameFmt = new Intl.DateTimeFormat("en-US", { month: "long" });
const monthDayFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const shortMonthFmt = new Intl.DateTimeFormat("en-US", { month: "short" });

export function formatLong(iso: string): string {
  return longFmt.format(parseISODate(iso));
}

export function formatMonthYear(iso: string): string {
  return monthYearFmt.format(parseISODate(iso));
}

export function formatMonthName(iso: string): string {
  return monthNameFmt.format(parseISODate(iso));
}

export function weekStart(iso: string): string {
  return addDaysISO(iso, -weekdayIndexMonday(iso));
}

export function weekDays(iso: string): string[] {
  const start = weekStart(iso);
  return Array.from({ length: 7 }, (_, index) => addDaysISO(start, index));
}

export function formatWeekRange(start: string): string {
  const end = addDaysISO(start, 6);
  const a = parseISODate(start);
  const b = parseISODate(end);
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
    return `${shortMonthFmt.format(a)} ${a.getDate()} – ${b.getDate()}`;
  }
  return `${monthDayFmt.format(a)} – ${monthDayFmt.format(b)}`;
}

export function monthStart(iso: string): string {
  const date = parseISODate(iso);
  return toISODate(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function monthEnd(iso: string): string {
  const date = parseISODate(iso);
  return toISODate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

export function shiftMonth(iso: string, delta: number): string {
  const date = parseISODate(iso);
  return toISODate(new Date(date.getFullYear(), date.getMonth() + delta, 1));
}

export function monthCells(iso: string): (string | null)[] {
  const date = parseISODate(iso);
  const year = date.getFullYear();
  const month = date.getMonth();
  const startPad = (new Date(year, month, 1).getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: startPad }, () => null);
  for (let day = 1; day <= count; day += 1) {
    cells.push(toISODate(new Date(year, month, day)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function eachDate(from: string, to: string): string[] {
  if (from > to) return [];
  const dates: string[] = [];
  let cursor = from;
  while (cursor <= to && dates.length < 4000) {
    dates.push(cursor);
    cursor = addDaysISO(cursor, 1);
  }
  return dates;
}
