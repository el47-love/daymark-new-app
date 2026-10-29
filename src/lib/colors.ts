export const HABIT_COLORS = [
  { id: "pine", label: "Pine", swatch: "bg-habit-pine" },
  { id: "sea", label: "Sea", swatch: "bg-habit-sea" },
  { id: "clay", label: "Clay", swatch: "bg-habit-clay" },
  { id: "ink", label: "Ink", swatch: "bg-habit-ink" },
  { id: "olive", label: "Olive", swatch: "bg-habit-olive" },
  { id: "rose", label: "Rose", swatch: "bg-habit-rose" },
  { id: "slate", label: "Slate", swatch: "bg-habit-slate" },
  { id: "sand", label: "Sand", swatch: "bg-habit-sand" },
] as const;

export type HabitColor = (typeof HABIT_COLORS)[number]["id"];

export function isHabitColor(value: string): value is HabitColor {
  return HABIT_COLORS.some((color) => color.id === value);
}

export function habitColor(id: string) {
  return HABIT_COLORS.find((color) => color.id === id) ?? HABIT_COLORS[0];
}

export function nextColor(used: readonly string[]): HabitColor {
  return HABIT_COLORS.find((color) => !used.includes(color.id))?.id ?? "pine";
}
