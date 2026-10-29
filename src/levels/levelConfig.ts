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
