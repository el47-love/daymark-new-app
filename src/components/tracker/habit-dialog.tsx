import { Check } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Modal } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { HABIT_COLORS, type HabitColor } from "@/lib/colors";
import type { Habit, HabitInput } from "@/lib/types";
import { cn } from "@/lib/utils";

export function HabitDialog({
  open,
  mode,
  habit,
  defaultColor,
  onOpenChange,
  onSave,
  onDelete,
}: {
  open: boolean;
  mode: "create" | "edit";
  habit: Habit | null;
  defaultColor: HabitColor;
  onOpenChange: (open: boolean) => void;
  onSave: (input: HabitInput) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [color, setColor] = useState<HabitColor>(defaultColor);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(habit?.name ?? "");
    setNote(habit?.note ?? "");
    setColor(habit?.color ?? defaultColor);
    setError("");
    setConfirming(false);
  }, [open, habit, defaultColor]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give it a name.");
      return;
    }
    onSave({ name: trimmed, note: note.trim(), color });
  }

  return (
    <>
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title={mode === "edit" ? "Edit habit" : "New habit"}
        description={
          mode === "edit" ? "Name, note, and color stay on this device." : "A name and a color are enough."
        }
      >
        <form onSubmit={submit}>
          <label htmlFor="habit-name" className="mb-2 block text-sm font-medium">
            Name
          </label>
          <Input
            id="habit-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (error) setError("");
            }}
            maxLength={48}
            autoComplete="off"
            placeholder="Walk outside"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "habit-name-error" : undefined}
            autoFocus
          />
          {error ? (
            <p id="habit-name-error" role="alert" className="mt-2 text-sm text-danger">
              {error}
            </p>
          ) : null}

          <label htmlFor="habit-note" className="mt-4 mb-2 block text-sm font-medium">
            Note
          </label>
          <Input
            id="habit-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={80}
            autoComplete="off"
            placeholder="Optional cue"
          />

          <p className="mt-4 mb-2 text-sm font-medium" id="habit-color-label">
            Color
          </p>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby="habit-color-label">
            {HABIT_COLORS.map((option) => {
              const selected = color === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setColor(option.id)}
                  className={cn(
                    "pressable motion-colors flex h-11 items-center gap-2 rounded-md border px-3 text-sm",
                    selected ? "border-fg bg-surface" : "border-line bg-bg",
                  )}
                >
                  <span className={cn("size-3 shrink-0 rounded-full", option.swatch)} aria-hidden />
                  <span className="min-w-0 flex-1 text-left">{option.label}</span>
                  {selected ? <Check className="size-4 shrink-0" aria-hidden /> : null}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex gap-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {mode === "edit" ? "Save" : "Add habit"}
            </Button>
          </div>
          {mode === "edit" && habit ? (
            <Button type="button" variant="danger" className="mt-2 w-full" onClick={() => setConfirming(true)}>
              Remove habit
            </Button>
          ) : null}
        </form>
      </Modal>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={habit ? `Remove ${habit.name}?` : "Remove habit?"}
        description="Its checkmarks and streaks are deleted with it. This cannot be undone."
        confirmLabel="Remove habit"
        onConfirm={() => {
          setConfirming(false);
          onDelete();
        }}
      />
    </>
  );
}
