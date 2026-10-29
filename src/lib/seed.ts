import { addDaysISO, toISODate } from "@/lib/dates";
import type { CheckMap, Habit } from "@/lib/types";

export function buildSeed(now = new Date()): {
  habits: Habit[];
  checks: CheckMap;
  initialized: true;
} {
  const today = toISODate(now);
  const day = (offset: number) => addDaysISO(today, -offset);
  const checks: CheckMap = {};
  const mark = (id: string, offset: number) => {
    checks[`${id}|${day(offset)}`] = true;
  };
  const markRange = (id: string, from: number, to: number) => {
    for (let offset = from; offset <= to; offset += 1) mark(id, offset);
  };

  const habits: Habit[] = [
    {
      id: "habit-walk",
      name: "Walk outside",
      note: "Twenty quiet minutes",
      color: "pine",
      createdAt: day(30),
      status: "active",
    },
    {
      id: "habit-read",
      name: "Read",
      note: "Ten pages",
      color: "ink",
      createdAt: day(36),
      status: "active",
    },
    {
      id: "habit-water",
      name: "Drink water",
      note: "A glass with lunch",
      color: "sea",
      createdAt: day(28),
      status: "active",
    },
    {
      id: "habit-stretch",
      name: "Stretch",
      note: "A few minutes on the floor",
      color: "clay",
      createdAt: day(22),
      status: "active",
    },
  ];

  markRange("habit-walk", 0, 11);
  markRange("habit-walk", 14, 30);

  markRange("habit-read", 1, 4);
  markRange("habit-read", 10, 17);
  for (let offset = 20; offset <= 36; offset += 2) mark("habit-read", offset);

  markRange("habit-water", 0, 8);
  for (let offset = 11; offset <= 28; offset += 1) {
    if (offset % 4 !== 0) mark("habit-water", offset);
  }

  markRange("habit-stretch", 1, 6);
  markRange("habit-stretch", 12, 22);

  return { habits, checks, initialized: true };
}
