import { describe, expect, it } from "vitest";
import {
  ADDITION_LEVELS, SUBTRACTION_LEVELS, DIVISION_LEVELS, MULTIPLICATION_LEVELS,
  MAX_DIFFICULTY, validateLevelDefinition,
} from "./levelConfig.ts";

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
