export type ReminderSettings = {
  enabled: boolean;
  time: string; // "HH:MM", 24-hour, local time
  lastSent?: string; // local YYYY-MM-DD of the last reminder
};

export const REMINDER_KEY = "daymark-reminders";
export const DEFAULT_REMINDER: ReminderSettings = { enabled: false, time: "20:00" };

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

export function minutesOf(time: string): number {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function localDateISO(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function readReminder(storage: Pick<Storage, "getItem"> | undefined): ReminderSettings {
  try {
    const raw = storage?.getItem(REMINDER_KEY);
    if (!raw) return DEFAULT_REMINDER;
    const parsed = JSON.parse(raw) as Partial<ReminderSettings>;
    return {
      enabled: parsed.enabled === true,
      time: typeof parsed.time === "string" && isValidTime(parsed.time) ? parsed.time : DEFAULT_REMINDER.time,
      lastSent: typeof parsed.lastSent === "string" ? parsed.lastSent : undefined,
    };
  } catch {
    return DEFAULT_REMINDER;
  }
}

// Fire at most once per local day, only after the chosen time, and only when
// something is still unchecked. Pure so it can be tested without a browser.
export function shouldRemind(input: {
  settings: ReminderSettings;
  now: Date;
  today: string;
  pending: number;
}): boolean {
  const { settings, now, today, pending } = input;
  if (!settings.enabled || pending <= 0) return false;
  if (settings.lastSent === today) return false;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= minutesOf(settings.time);
}
