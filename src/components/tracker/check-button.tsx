import { Check } from "lucide-react";
import { habitColor, type HabitColor } from "@/lib/colors";
import { cn } from "@/lib/utils";

export function CheckButton({
  checked,
  color,
  label,
  emphasized = false,
  disabled = false,
  onClick,
}: {
  checked: boolean;
  color: HabitColor;
  label: string;
  emphasized?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "pressable motion-colors inline-flex size-12 shrink-0 items-center justify-center rounded-full border",
        checked
          ? cn(habitColor(color).swatch, "border-transparent text-accent-fg")
          : "bg-bg text-transparent",
        !checked && emphasized && "border-accent",
        !checked && !emphasized && "border-line-strong",
        !checked && !disabled && "hover:bg-surface",
        disabled && "opacity-40",
      )}
    >
      <Check className="size-5" strokeWidth={2.5} />
    </button>
  );
}
