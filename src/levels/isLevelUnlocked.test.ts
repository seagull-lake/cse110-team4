import { describe, expect, it } from "vitest";
import { ADDITION_LEVELS } from "./levelConfig.ts";
import { initialProgression, isLevelUnlocked } from "./progression.ts";
import type { ProgressionState } from "./progression.ts";

const atLevel = (currentDifficulty: number, isCompleted = false): ProgressionState =>
  ({ ...initialProgression(ADDITION_LEVELS), currentDifficulty, isCompleted });

describe("isLevelUnlocked", () => {
  it("opens only level 1 at the start", () => {
    const state = initialProgression(ADDITION_LEVELS);
    expect([1, 2, 3, 4, 5].map(d => isLevelUnlocked(ADDITION_LEVELS, state, d)))
      .toEqual([true, false, false, false, false]);
  });

  it("opens completed levels and the current one, not the ones after it", () => {
    expect([1, 2, 3, 4, 5].map(d => isLevelUnlocked(ADDITION_LEVELS, atLevel(3), d)))
      .toEqual([true, true, true, false, false]);
  });

  it("opens every level once the topic is finished", () => {
    expect([1, 2, 3, 4, 5].every(d => isLevelUnlocked(ADDITION_LEVELS, atLevel(5, true), d))).toBe(true);
  });

  it.each([0, -1, 6, 2.5, NaN])("rejects difficulty %s, which is not a level", difficulty => {
    expect(isLevelUnlocked(ADDITION_LEVELS, atLevel(5, true), difficulty)).toBe(false);
  });
});
