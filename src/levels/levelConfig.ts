import type { OperationType } from "../domain/problem.ts";

export type LevelType = OperationType;

/** Static configuration for one operation; progression is stored separately. */
export interface LevelDefinition {
  /** Stable operation ID shared by all its difficulties. */
  readonly id: string;
  readonly type: LevelType;
  /** Highest selectable difficulty for this operation. */
  readonly maxDifficulty: number;
}

export const MAX_DIFFICULTY = 5;

/** Digit count for each operand, keyed by difficulty (1-5). */
export type OperandDigitsByDifficulty = { [difficulty: number]: readonly number[] };

/** Each array contains the digit count for each operand at that difficulty. */
export interface ProblemDifficultyConfig {
  mainGame: Record<OperationType, OperandDigitsByDifficulty>;
  miniGameOne: { [difficulty: number]: readonly [number, number] };
}

// Main-game difficulty per operation. Each array is one problem: one entry per operand,
// each number is that operand's digit count. For division it is [dividend, divisor].
// Every main-game level has exactly two operands, which is what the problem screen shows.
export const problemDifficultyConfig: ProblemDifficultyConfig = {
  mainGame: {
    addition:       { 1: [1, 1], 2: [2, 2], 3: [3, 3], 4: [4, 4], 5: [5, 5] },
    subtraction:    { 1: [2, 1], 2: [3, 2], 3: [3, 3], 4: [4, 4], 5: [5, 5] },
    multiplication: { 1: [1, 1], 2: [2, 1], 3: [2, 2], 4: [3, 2], 5: [5, 3] },
    division:       { 1: [2, 1], 2: [3, 1], 3: [3, 2], 4: [4, 2], 5: [5, 3] },
  },
  miniGameOne: { 1: [1, 1] },
};

export const ADDITION_LEVELS: LevelDefinition = {
  id: "addition",
  type: "addition",
  maxDifficulty: MAX_DIFFICULTY,
};

export const SUBTRACTION_LEVELS: LevelDefinition = {
  id: "subtraction",
  type: "subtraction",
  maxDifficulty: MAX_DIFFICULTY,
};

export const DIVISION_LEVELS: LevelDefinition = {
  id: "division",
  type: "division",
  maxDifficulty: MAX_DIFFICULTY,
};

export const MULTIPLICATION_LEVELS: LevelDefinition = {
  id: "multiplication",
  type: "multiplication",
  maxDifficulty: MAX_DIFFICULTY,
};

const LEVELS_BY_TYPE: Record<LevelType, LevelDefinition> = {
  addition: ADDITION_LEVELS,
  subtraction: SUBTRACTION_LEVELS,
  multiplication: MULTIPLICATION_LEVELS,
  division: DIVISION_LEVELS,
};

/** Every operation's definition, in a stable order (used to check progress across all topics). */
export function getAllLevelDefinitions(): readonly LevelDefinition[] {
  return Object.values(LEVELS_BY_TYPE);
}

export function getLevelDefinition(type: LevelType): LevelDefinition {
  const level = LEVELS_BY_TYPE[type];
  if (!level) throw new Error(`Unknown level type: ${type}`);
  return level;
}

export function validateLevelDefinition(level: LevelDefinition): void {
  if (!level.id.trim()) throw new Error("Level ID must be non-empty.");
  if (!["addition", "subtraction", "division", "multiplication"].includes(level.type)) {
    throw new Error("Unsupported level type.");
  }
  if (!Number.isInteger(level.maxDifficulty) || level.maxDifficulty < 1) {
    throw new Error("Maximum difficulty must be a positive integer.");
  }
}

for (const level of [ADDITION_LEVELS, SUBTRACTION_LEVELS, DIVISION_LEVELS, MULTIPLICATION_LEVELS]) {
  validateLevelDefinition(level);
}
