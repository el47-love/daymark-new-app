import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeState } from "./persist-state.ts";
import { buildBackup, parseBackup } from "./backup.ts";
import { shouldRemind, isValidTime } from "./reminders.ts";

test("normalizeState fills defaults and drops bad rows", () => {
  const state = normalizeState({
    habits: [
      { id: "a", name: "Read", createdAt: "2026-01-01", color: "nope" },
      { id: 5, name: "bad" },
      { id: "b", name: "Walk", createdAt: "2026-01-01", color: "sea", status: "paused" },
    ],
    checks: { "a|2026-01-02": true, broken: true },
    notes: { "a|2026-01-02": "  felt good  ", "a|2026-01-03": "unchecked", "a|2026-01-02 ": 3 },
    initialized: true,
  });
  assert.equal(state.habits.length, 2);
  assert.equal(state.habits[0]?.color, "pine");
  assert.equal(state.habits[0]?.status, "active");
  assert.equal(state.habits[1]?.status, "paused");
  assert.deepEqual(Object.keys(state.checks), ["a|2026-01-02"]);
  assert.deepEqual(state.notes, { "a|2026-01-02": "felt good" });
});

test("normalizeState tolerates missing input", () => {
  const state = normalizeState(undefined);
  assert.deepEqual(state, { habits: [], checks: {}, notes: {}, initialized: false });
});

test("backup round-trips habits, checks and notes", () => {
  const original = normalizeState({
    habits: [{ id: "a", name: "Read", createdAt: "2026-01-01", color: "ink", status: "archived" }],
    checks: { "a|2026-01-02": true },
    notes: { "a|2026-01-02": "chapter three" },
    initialized: true,
  });
  const restored = parseBackup(buildBackup(original, new Date("2026-01-03T00:00:00Z")));
  assert.deepEqual(restored, original);
});

test("parseBackup rejects foreign and newer files", () => {
  assert.throws(() => parseBackup("not json"), /valid JSON/);
  assert.throws(() => parseBackup(JSON.stringify({ habits: [] })), /isn't a Daymark backup/);
  assert.throws(
    () => parseBackup(JSON.stringify({ format: "daymark-backup", version: 99, habits: [] })),
    /newer version/,
  );
});

test("shouldRemind respects time, day, pending and settings", () => {
  const base = { settings: { enabled: true, time: "20:00" }, today: "2026-01-02", pending: 2 };
  assert.equal(shouldRemind({ ...base, now: new Date(2026, 0, 2, 19, 59) }), false);
  assert.equal(shouldRemind({ ...base, now: new Date(2026, 0, 2, 20, 0) }), true);
  assert.equal(shouldRemind({ ...base, now: new Date(2026, 0, 2, 21, 0), pending: 0 }), false);
  assert.equal(shouldRemind({ ...base, now: new Date(2026, 0, 2, 21, 0), settings: { enabled: false, time: "20:00" } }), false);
  assert.equal(
    shouldRemind({ ...base, now: new Date(2026, 0, 2, 21, 0), settings: { enabled: true, time: "20:00", lastSent: "2026-01-02" } }),
    false,
  );
});

test("isValidTime accepts only HH:MM", () => {
  assert.equal(isValidTime("07:30"), true);
  assert.equal(isValidTime("24:00"), false);
  assert.equal(isValidTime("7:30"), false);
});
