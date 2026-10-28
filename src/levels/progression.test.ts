import { describe, expect, it } from "vitest";
import { ADDITION_LEVELS } from "./levelConfig.ts";
import { completeLevel, initialProgression, levelId, progressCount, startLevel } from "./progression.ts";

describe("level progression", () => {
  it("starts with the first difficulty available", () => {
    const state = initialProgression(ADDITION_LEVELS);
    expect(progressCount(ADDITION_LEVELS, state)).toEqual({ completed: 0, total: 5 });
    expect(state.currentDifficulty).toBe(1);
    expect(state.levelId).toBe("addition");
    expect(startLevel(ADDITION_LEVELS, state, "addition").isActive).toBe(true);
  });

  it("unlocks one difficulty on completion", () => {
    const active = startLevel(ADDITION_LEVELS, initialProgression(ADDITION_LEVELS), "addition");
    const completed = completeLevel(ADDITION_LEVELS, active, "addition");
    expect(progressCount(ADDITION_LEVELS, completed).completed).toBe(1);
    expect(completed.currentDifficulty).toBe(2);
    expect(startLevel(ADDITION_LEVELS, completed, "addition").isActive).toBe(true);
  });

  it("rejects other categories, inactive and repeated levels", () => {
    const initial = initialProgression(ADDITION_LEVELS);
    expect(() => startLevel(ADDITION_LEVELS, initial, "missing")).toThrow();
    expect(() => startLevel(ADDITION_LEVELS, initial, "subtraction")).toThrow();
    expect(() => completeLevel(ADDITION_LEVELS, initial, "addition")).toThrow();
    const active = startLevel(ADDITION_LEVELS, initial, "addition");
    expect(() => startLevel(ADDITION_LEVELS, active, "addition")).toThrow();
    const completed = completeLevel(ADDITION_LEVELS, active, "addition");
    expect(() => completeLevel(ADDITION_LEVELS, completed, "addition")).toThrow();
    expect(() => startLevel(ADDITION_LEVELS, { ...initial, levelId: "subtraction" }, "addition")).toThrow();
  });

  it("stops after the final difficulty", () => {
    let state = initialProgression(ADDITION_LEVELS);
    for (let difficulty = 1; difficulty <= ADDITION_LEVELS.difficulty.length; difficulty++) {
      const id = levelId(ADDITION_LEVELS);
      state = completeLevel(ADDITION_LEVELS, startLevel(ADDITION_LEVELS, state, id), id);
    }
    expect(progressCount(ADDITION_LEVELS, state)).toEqual({ completed: 5, total: 5 });
    expect(state.currentDifficulty).toBe(6);
    expect(() => startLevel(ADDITION_LEVELS, state, "addition")).toThrow();
  });
});
