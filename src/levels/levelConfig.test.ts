import { describe, expect, it } from "vitest";
import {
  ADDITION_LEVELS, SUBTRACTION_LEVELS, DIVISION_LEVELS, MULTIPLICATION_LEVELS,
  LEVEL_DIFFICULTIES, validateLevelDefinition,
} from "./levelConfig.ts";

describe("operation level definitions", () => {
  const definitions = [ADDITION_LEVELS, SUBTRACTION_LEVELS, DIVISION_LEVELS, MULTIPLICATION_LEVELS];

  it("defines each operation once with five selectable difficulties", () => {
    expect(definitions.map((level) => level.type)).toEqual([
      "addition", "subtraction", "division", "multiplication",
    ]);
    expect(definitions.map((level) => level.id)).toEqual(definitions.map((level) => level.type));
    for (const level of definitions) {
      expect(() => validateLevelDefinition(level)).not.toThrow();
      expect(level.difficulty).toBe(LEVEL_DIFFICULTIES);
    }
    expect(LEVEL_DIFFICULTIES).toEqual([
      { firstOperandDigits: 1, secondOperandDigits: 1 },
      { firstOperandDigits: 2, secondOperandDigits: 1 },
      { firstOperandDigits: 2, secondOperandDigits: 2 },
      { firstOperandDigits: 3, secondOperandDigits: 2 },
      { firstOperandDigits: 3, secondOperandDigits: 3 },
    ]);
  });

  it("rejects missing difficulties", () => {
    expect(() => validateLevelDefinition({ ...ADDITION_LEVELS, difficulty: [] })).toThrow();
  });

  it("requires positive whole operand digit counts", () => {
    const difficulty = [...ADDITION_LEVELS.difficulty];
    difficulty[0] = { ...difficulty[0], firstOperandDigits: 0 };
    expect(() => validateLevelDefinition({ ...ADDITION_LEVELS, difficulty })).toThrow();
  });
});
