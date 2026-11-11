import { describe, expect, it } from "vitest";
import {
  ADDITION_LEVELS, DIVISION_LEVELS, MAX_DIFFICULTY, SUBTRACTION_LEVELS, getAllLevelDefinitions,
} from "./levelConfig.ts";
import type { LevelDefinition } from "./levelConfig.ts";
import {
  completeLevel, getLevelStatus, getProgressSummary, initialProgression, isValidProgression,
  progressCount, startLevel,
} from "./progression.ts";
import type { ProgressionState } from "./progression.ts";

function stateAt(
  currentDifficulty: number, isCompleted = false, isActive = false, level: LevelDefinition = ADDITION_LEVELS,
): ProgressionState {
  return { currentDifficulty, isActive, isCompleted, levelId: level.id };
}

const statusesOf = (state: ProgressionState, count = MAX_DIFFICULTY) =>
  Array.from({ length: count }, (_, index) => getLevelStatus(state, index + 1));

describe("getLevelStatus", () => {
  it("starts with level 1 current and the rest locked", () => {
    expect(statusesOf(initialProgression(ADDITION_LEVELS)))
      .toEqual(["current", "locked", "locked", "locked", "locked"]);
  });

  it("marks levels below the current one completed and above it locked", () => {
    expect(statusesOf(stateAt(3))).toEqual(["completed", "completed", "current", "locked", "locked"]);
    expect(statusesOf(stateAt(5))).toEqual(["completed", "completed", "completed", "completed", "current"]);
  });

  it("keeps the current level current while it is being played", () => {
    expect(statusesOf(stateAt(3, false, true))).toEqual(statusesOf(stateAt(3)));
  });

  it("marks every level completed, and none current, once the topic is finished", () => {
    expect(statusesOf(stateAt(5, true))).toEqual(Array(5).fill("completed"));
  });

  it("follows real progression one level at a time", () => {
    let state = initialProgression(ADDITION_LEVELS);
    for (let finished = 0; finished < MAX_DIFFICULTY; finished++) {
      const statuses = statusesOf(state);
      expect(statuses.filter(status => status === "completed")).toHaveLength(finished);
      expect(statuses.filter(status => status === "current")).toHaveLength(1);
      expect(statuses.filter(status => status === "locked")).toHaveLength(MAX_DIFFICULTY - finished - 1);
      expect(statuses[finished]).toBe("current");
      state = completeLevel(ADDITION_LEVELS, startLevel(ADDITION_LEVELS, state, "addition"), "addition");
    }
    expect(statusesOf(state)).toEqual(Array(5).fill("completed"));
  });

  it("agrees with progressCount at every step", () => {
    let state = initialProgression(ADDITION_LEVELS);
    for (let step = 0; step <= MAX_DIFFICULTY; step++) {
      const completed = statusesOf(state).filter(status => status === "completed").length;
      expect(completed).toBe(progressCount(ADDITION_LEVELS, state).completed);
      if (step < MAX_DIFFICULTY) {
        state = completeLevel(ADDITION_LEVELS, startLevel(ADDITION_LEVELS, state, "addition"), "addition");
      }
    }
  });
});

describe("getProgressSummary", () => {
  it("lists completed, current and locked levels", () => {
    expect(getProgressSummary(ADDITION_LEVELS, initialProgression(ADDITION_LEVELS)))
      .toEqual({ completed: [], current: 1, locked: [2, 3, 4, 5] });
    expect(getProgressSummary(ADDITION_LEVELS, stateAt(4)))
      .toEqual({ completed: [1, 2, 3], current: 4, locked: [5] });
    expect(getProgressSummary(ADDITION_LEVELS, stateAt(5)))
      .toEqual({ completed: [1, 2, 3, 4], current: 5, locked: [] });
  });

  it("has no current level once everything is completed", () => {
    expect(getProgressSummary(ADDITION_LEVELS, stateAt(5, true)))
      .toEqual({ completed: [1, 2, 3, 4, 5], current: null, locked: [] });
  });

  it("covers every level exactly once for every topic and every state", () => {
    for (const level of getAllLevelDefinitions()) {
      const states = [
        ...Array.from({ length: level.maxDifficulty }, (_, i) => stateAt(i + 1, false, false, level)),
        stateAt(level.maxDifficulty, true, false, level),
      ];
      for (const state of states) {
        const { completed, current, locked } = getProgressSummary(level, state);
        const all = [...completed, ...(current === null ? [] : [current]), ...locked].sort();
        expect(all).toEqual(Array.from({ length: level.maxDifficulty }, (_, i) => i + 1));
        expect(completed).toHaveLength(progressCount(level, state).completed);
      }
    }
  });

  it("follows the level's own maximum difficulty", () => {
    const shortLevel = { ...ADDITION_LEVELS, maxDifficulty: 3 };
    expect(getProgressSummary(shortLevel, stateAt(2))).toEqual({ completed: [1], current: 2, locked: [3] });
  });

  it("rejects a state that doesn't belong to the level", () => {
    expect(() => getProgressSummary(ADDITION_LEVELS, stateAt(1, false, false, SUBTRACTION_LEVELS))).toThrow();
    expect(() => getProgressSummary(ADDITION_LEVELS, stateAt(6))).toThrow();
  });
});

describe("isValidProgression", () => {
  it("accepts every reachable state", () => {
    for (let difficulty = 1; difficulty <= MAX_DIFFICULTY; difficulty++) {
      expect(isValidProgression(ADDITION_LEVELS, stateAt(difficulty))).toBe(true);
      expect(isValidProgression(ADDITION_LEVELS, stateAt(difficulty, false, true))).toBe(true);
    }
    expect(isValidProgression(ADDITION_LEVELS, stateAt(5, true))).toBe(true);
  });

  it.each([
    ["a different topic", stateAt(1, false, false, DIVISION_LEVELS)],
    ["difficulty 0", stateAt(0)],
    ["difficulty above the maximum", stateAt(6)],
    ["a negative difficulty", stateAt(-1)],
    ["a fractional difficulty", stateAt(2.5)],
    ["NaN", stateAt(NaN)],
    ["completed before the last difficulty", stateAt(3, true)],
    ["active and completed at once", stateAt(5, true, true)],
  ])("rejects %s", (_name, state) => {
    expect(isValidProgression(ADDITION_LEVELS, state)).toBe(false);
  });

  it("agrees with what the progression functions accept", () => {
    expect(() => startLevel(ADDITION_LEVELS, stateAt(6), "addition")).toThrow("Invalid progression state.");
    expect(() => startLevel(ADDITION_LEVELS, stateAt(3), "addition")).not.toThrow();
  });
});

describe("level definitions list", () => {
  it("returns each topic once, all valid", () => {
    const definitions = getAllLevelDefinitions();
    expect(definitions.map(level => level.type).sort())
      .toEqual(["addition", "division", "multiplication", "subtraction"]);
    expect(new Set(definitions.map(level => level.id)).size).toBe(definitions.length);
    expect(definitions).toContain(ADDITION_LEVELS);
  });
});
