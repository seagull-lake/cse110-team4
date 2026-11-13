import { describe, expect, it } from "vitest";
import {
  ADDITION_LEVELS, SUBTRACTION_LEVELS, DIVISION_LEVELS, MULTIPLICATION_LEVELS,
  MAX_DIFFICULTY, problemDifficultyConfig, validateLevelDefinition,
} from "./levelConfig.ts";

describe("problemDifficultyConfig", () => {
  const operations = ["addition", "subtraction", "multiplication", "division"] as const;
  const levelsFor = (operation: (typeof operations)[number]) =>
    Array.from({ length: MAX_DIFFICULTY }, (_, i) => problemDifficultyConfig.mainGame[operation][i + 1]);

  it.each(operations)("defines five valid, distinct levels for %s", operation => {
    const levels = levelsFor(operation);
    for (const digits of levels) {
      expect(digits.length).toBeGreaterThanOrEqual(2);
      expect(digits.every(d => Number.isInteger(d) && d >= 1 && d <= 15)).toBe(true);
    }
    expect(new Set(levels.map(digits => digits.join(","))).size).toBe(MAX_DIFFICULTY);
  });

  it.each(operations)("reaches 5-digit numbers at the top %s level", operation => {
    expect(Math.max(...levelsFor(operation)[MAX_DIFFICULTY - 1])).toBe(5);
  });

});

describe("operation level definitions", () => {
  const definitions = [ADDITION_LEVELS, SUBTRACTION_LEVELS, DIVISION_LEVELS, MULTIPLICATION_LEVELS];

  it("defines each operation once with a maximum selectable difficulty", () => {
    expect(definitions.map((level) => level.type)).toEqual([
      "addition", "subtraction", "division", "multiplication",
    ]);
    expect(definitions.map((level) => level.id)).toEqual(definitions.map((level) => level.type));
    for (const level of definitions) {
      expect(() => validateLevelDefinition(level)).not.toThrow();
      expect(level.maxDifficulty).toBe(MAX_DIFFICULTY);
    }
  });

  it("requires a positive whole maximum difficulty", () => {
    expect(() => validateLevelDefinition({ ...ADDITION_LEVELS, maxDifficulty: 0 })).toThrow();
    expect(() => validateLevelDefinition({ ...ADDITION_LEVELS, maxDifficulty: 1.5 })).toThrow();
  });
});
