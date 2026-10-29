import {
  ChevronDown,
  ChevronUp,
  Download,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Archive,
  Upload,
} from "lucide-react";
import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { loadReminder, saveReminder } from "@/components/tracker/reminder-watcher";
import { habitColor } from "@/lib/colors";
import { buildBackup, parseBackup } from "@/lib/backup";
import { localDateISO, isValidTime, type ReminderSettings } from "@/lib/reminders";
import type { Persisted } from "@/lib/persist-state";
import { useHabits } from "@/lib/store";
import type { Habit, HabitStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

export function SettingsView({ habits, onEdit }: { habits: Habit[]; onEdit: (habit: Habit) => void }) {
  return (
    <div className="mt-6 flex flex-col gap-10">
      <ManageSection habits={habits} onEdit={onEdit} />
      <RemindersSection />
      <BackupSection />
    </div>
  );
}

function SectionHeading({ id, title, children }: { id: string; title: string; children?: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="font-display text-2xl font-medium tracking-tight">
        {title}
      </h2>
      {children ? <div className="text-sm text-muted">{children}</div> : null}
    </section>
  );
}

const GROUPS: { status: HabitStatus; label: string }[] = [
  { status: "active", label: "Active" },
  { status: "paused", label: "Paused" },
  { status: "archived", label: "Archived" },
];

function ManageSection({ habits, onEdit }: { habits: Habit[]; onEdit: (habit: Habit) => void }) {
  const setStatus = useHabits((state) => state.setStatus);
  const moveHabit = useHabits((state) => state.moveHabit);

  return (
    <SectionHeading id="manage-heading" title="Manage habits">
      Paused and archived habits are hidden from Today, Week and Month, but keep their history. Use the arrows to reorder within a group.
      {GROUPS.map((group) => {
        const items = habits.filter((habit) => habit.status === group.status);
        if (items.length === 0 && group.status !== "active") return null;
        return (
          <span key={group.status} className="mt-4 block">
            <span className="mb-2 block text-xs font-medium tracking-wide text-muted uppercase">
              {group.label} · {items.length}
            </span>
            {items.length === 0 ? (
              <span className="block rounded-xl border border-dashed border-line px-4 py-3 text-sm text-muted">
                No active habits.
              </span>
            ) : (
              <ul className="flex flex-col gap-2">
                {items.map((habit, index) => (
                  <li
                    key={habit.id}
                    className="flex items-center gap-2 rounded-xl border border-line bg-elevated py-2 pr-2 pl-3"
                  >
                    <span className={cn("h-8 w-1 shrink-0 rounded-full", habitColor(habit.color).swatch)} aria-hidden />
                    <span className="min-w-0 flex-1 truncate font-medium text-fg">{habit.name}</span>
                    {group.status !== "archived" ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Move ${habit.name} up`}
                          disabled={index === 0}
                          onClick={() => moveHabit(habit.id, -1)}
                        >
                          <ChevronUp className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Move ${habit.name} down`}
                          disabled={index === items.length - 1}
                          onClick={() => moveHabit(habit.id, 1)}
                        >
                          <ChevronDown className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label={`Edit ${habit.name}`} onClick={() => onEdit(habit)}>
                          <Pencil className="size-4" />
                        </Button>
                        {habit.status === "active" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Pause ${habit.name}`}
                            onClick={() => setStatus(habit.id, "paused")}
                          >
                            <Pause className="size-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Resume ${habit.name}`}
                            onClick={() => setStatus(habit.id, "active")}
                          >
                            <Play className="size-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Archive ${habit.name}`}
                          onClick={() => setStatus(habit.id, "archived")}
                        >
                          <Archive className="size-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="secondary"
                        aria-label={`Restore ${habit.name}`}
                        onClick={() => setStatus(habit.id, "active")}
                      >
                        <RotateCcw className="size-4" />
                        Restore
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </span>
        );
      })}
    </SectionHeading>
  );
}

function RemindersSection() {
const [settings, setSettings] = useState<ReminderSettings>(() => loadReminder());
const isNative = Capacitor.isNativePlatform();
const [permission, setPermission] = useState<string>(() => {
if (isNative) return "prompt";
return typeof Notification === "undefined" ? "unsupported" : Notification.permission;
});
const [message, setMessage] = useState("");

function update(next: ReminderSettings) {
setSettings(next);
saveReminder(next);
}

async function setNativeReminder(next: ReminderSettings) {
try {
let status = await LocalNotifications.checkPermissions();

  if (status.display !== "granted") {
    status = await LocalNotifications.requestPermissions();
  }

  setPermission(status.display);

  if (status.display !== "granted") {
    setMessage("Please allow notifications for Daymark in Android settings.");
    return;
  }

  await LocalNotifications.cancel({
    notifications: [{ id: 1001 }],
  });

  if (next.enabled) {
    const [hour, minute] = next.time.split(":").map(Number);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1001,
          title: "Daymark daily reminder",
          body: "Take a moment to review your habits for today.",
          schedule: {
            on: { hour, minute },
            every: "day",
            allowWhileIdle: true,
          },
          channelId: "daymark-reminders",
        },
      ],
    });
  }

  update(next);
  setMessage(
    next.enabled
      ? `Daily reminder scheduled for ${next.time}.`
      : "Daily reminder turned off.",
  );
} catch {
  setMessage("Could not schedule the Android reminder. Check notification permission and rebuild the APK.");
}

}

async function toggle() {
if (settings.enabled) {
if (isNative) {
await setNativeReminder({ ...settings, enabled: false });
} else {
update({ ...settings, enabled: false });
setMessage("");
}
return;
}

if (isNative) {
  await setNativeReminder({ ...settings, enabled: true });
  return;
}

if (typeof Notification === "undefined") {
  setMessage("This browser doesn't support notifications.");
  return;
}

let granted = Notification.permission;
if (granted === "default") {
  granted = await Notification.requestPermission();
}

setPermission(granted);

if (granted !== "granted") {
  setMessage("Notifications are blocked. Allow them in your browser settings and try again.");
  return;
}

update({ ...settings, enabled: true });
setMessage("");

}

function changeTime(time: string) {
if (!isValidTime(time)) return;

const next = { ...settings, time };

if (isNative && settings.enabled) {
  void setNativeReminder(next);
} else {
  update(next);
}

}

return (
<SectionHeading id="reminders-heading" title="Reminders">
Set a daily reminder at your chosen time. On Android, scheduled notifications can arrive while Daymark is closed. This reminder does not check which habits remain unfinished while the app is closed.
<span className="mt-4 flex flex-col gap-4 rounded-xl border border-line bg-elevated p-4">
<span className="flex items-center justify-between gap-3">
<span className="font-medium text-fg">Daily reminder</span>
<button
type="button"
role="switch"
aria-checked={settings.enabled}
aria-label="Daily reminder"
disabled={permission === "unsupported"}
onClick={() => void toggle()}
className={cn(
"pressable motion-colors relative h-7 w-12 shrink-0 rounded-full border border-line",
settings.enabled ? "bg-accent" : "bg-surface",
permission === "unsupported" && "opacity-40",
)}
>
<span
className={cn(
"absolute top-0.5 left-0.5 size-5 rounded-full bg-bg shadow transition-transform",
settings.enabled && "translate-x-5",
)}
/>
</button>
</span>
<label className="flex items-center justify-between gap-3 text-sm">
<span className="text-fg">Time</span>
<input
type="time"
value={settings.time}
disabled={!settings.enabled}
onChange={(event) => changeTime(event.target.value)}
className="h-10 rounded-md border border-line bg-bg px-3 text-fg disabled:opacity-40"
/>
</label>
{message ? (
<span role="status" className="text-sm text-muted">
{message}
</span>
) : null}
</span>
</SectionHeading>
);
}

  function update(next: ReminderSettings) {
    setSettings(next);
    saveReminder(next);
  }

  async function toggle() {
    if (settings.enabled) {
      setMessage("");
      update({ ...settings, enabled: false });
      return;
    }
    if (typeof Notification === "undefined") {
      setMessage("This browser doesn't support notifications.");
      return;
    }
    let granted = Notification.permission;
    if (granted === "default") granted = await Notification.requestPermission();
    setPermission(granted);
    if (granted !== "granted") {
      setMessage("Notifications are blocked for this site. Allow them in your browser settings, then try again.");
      return;
    }
    setMessage("");
    update({ ...settings, enabled: true });
  }

  return (
    <SectionHeading id="reminders-heading" title="Reminders">
      A daily nudge at your chosen time, only if something is still unchecked. Reminders arrive while Daymark is open in a browser tab.
      <span className="mt-4 flex flex-col gap-4 rounded-xl border border-line bg-elevated p-4">
        <span className="flex items-center justify-between gap-3">
          <span className="font-medium text-fg">Daily reminder</span>
          <button
            type="button"
            role="switch"
            aria-checked={settings.enabled}
            aria-label="Daily reminder"
            disabled={permission === "unsupported"}
            onClick={() => void toggle()}
            className={cn(
              "pressable motion-colors relative h-7 w-12 shrink-0 rounded-full border border-line",
              settings.enabled ? "bg-accent" : "bg-surface",
              permission === "unsupported" && "opacity-40",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 size-5 rounded-full bg-bg shadow transition-transform",
                settings.enabled && "translate-x-5",
              )}
            />
          </button>
        </span>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span className="text-fg">Time</span>
          <input
            type="time"
            value={settings.time}
            disabled={!settings.enabled}
            onChange={(event) => {
              if (isValidTime(event.target.value)) update({ ...settings, time: event.target.value });
            }}
            className="h-10 rounded-md border border-line bg-bg px-3 text-fg disabled:opacity-40"
          />
        </label>
        {message ? (
          <span role="alert" className="text-sm text-danger">
            {message}
          </span>
        ) : null}
      </span>
    </SectionHeading>
  );
}

function BackupSection() {
  const replaceAll = useHabits((state) => state.replaceAll);
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Persisted | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function exportBackup() {
    const now = new Date();
    const text = buildBackup(useHabits.getState(), now);
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `daymark-backup-${localDateISO(now)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setError("");
    setMessage("Backup downloaded.");
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setPending(parseBackup(await file.text()));
      setMessage("");
      setError("");
    } catch (err) {
      setMessage("");
      setError(err instanceof Error ? err.message : "That backup couldn't be read.");
    }
  }

  const pendingChecks = pending ? Object.keys(pending.checks).length : 0;

  return (
    <SectionHeading id="backup-heading" title="Backup">
      Your habits live only on this device. Export a file to keep a copy, or restore one on another device.
      <span className="mt-4 flex flex-col gap-3">
        <span className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={exportBackup}>
            <Download className="size-4" />
            Export backup
          </Button>
          <Button variant="secondary" onClick={() => fileInput.current?.click()}>
            <Upload className="size-4" />
            Import backup
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="Choose a Daymark backup file"
            onChange={(event) => void onFile(event)}
          />
        </span>
        {message ? (
          <span role="status" className="text-sm text-muted">
            {message}
          </span>
        ) : null}
        {error ? (
          <span role="alert" className="text-sm text-danger">
            {error}
          </span>
        ) : null}
      </span>
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title="Replace your data?"
        description={`This backup has ${pending?.habits.length ?? 0} habits and ${pendingChecks} checkmarks. It replaces everything currently on this device.`}
        confirmLabel="Replace data"
        onConfirm={() => {
          if (pending) replaceAll(pending);
          setPending(null);
          setError("");
          setMessage("Backup restored.");
        }}
      />
    </SectionHeading>
  );
}
