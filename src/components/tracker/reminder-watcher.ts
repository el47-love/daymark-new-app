import { useEffect } from "react";
import { useHabits } from "@/lib/store";
import { readReminder, REMINDER_KEY, shouldRemind, type ReminderSettings } from "@/lib/reminders";

export function loadReminder(): ReminderSettings {
  return readReminder(typeof window === "undefined" ? undefined : window.localStorage);
}

export function saveReminder(settings: ReminderSettings) {
  try {
    window.localStorage.setItem(REMINDER_KEY, JSON.stringify(settings));
  } catch {
    // Storage can be full or blocked; the reminder simply won't persist.
  }
}

async function showReminder(body: string): Promise<void> {
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration) {
      await registration.showNotification("Daymark", { body, tag: "daymark-reminder" });
      return;
    }
  } catch {
    // Fall back to the page-level API below.
  }
  try {
    new Notification("Daymark", { body, tag: "daymark-reminder" });
  } catch {
    // Notifications unsupported here; nothing else to do.
  }
}

// Checks every 30 seconds while the page is open. Browsers cannot send
// reminders to a closed tab without a server, so this is best-effort.
export function useReminderWatcher(today: string) {
  useEffect(() => {
    const tick = () => {
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      const settings = loadReminder();
      const { habits, checks } = useHabits.getState();
      const pending = habits.filter(
        (habit) => habit.status === "active" && !checks[`${habit.id}|${today}`],
      ).length;
      if (!shouldRemind({ settings, now: new Date(), today, pending })) return;
      const body =
        pending === 1 ? "One habit is still open today." : `${pending} habits are still open today.`;
      void showReminder(body);
      saveReminder({ ...settings, lastSent: today });
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [today]);
}
