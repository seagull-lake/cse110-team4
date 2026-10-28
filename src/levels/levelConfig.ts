export type LevelType = "addition" | "subtraction" | "division" | "multiplication";

/** Operand widths, in decimal digits, for one difficulty. */
export interface LevelDifficulty {
  readonly firstOperandDigits: number;
  readonly secondOperandDigits: number;
}

/** Static configuration for one operation; progression is stored separately. */
export interface LevelDefinition {
  /** Stable operation ID shared by all its difficulties. */
  readonly id: string;
  readonly type: LevelType;
  /** Ordered from difficulty 1 onward. */
  readonly difficulty: readonly LevelDifficulty[];
}

export const LEVEL_DIFFICULTIES: readonly LevelDifficulty[] = [
  { firstOperandDigits: 1, secondOperandDigits: 1 },
  { firstOperandDigits: 2, secondOperandDigits: 1 },
  { firstOperandDigits: 2, secondOperandDigits: 2 },
  { firstOperandDigits: 3, secondOperandDigits: 2 },
  { firstOperandDigits: 3, secondOperandDigits: 3 },
];

export const ADDITION_LEVELS: LevelDefinition = {
  id: "addition",
  type: "addition",
  difficulty: LEVEL_DIFFICULTIES,
};

export const SUBTRACTION_LEVELS: LevelDefinition = {
  id: "subtraction",
  type: "subtraction",
  difficulty: LEVEL_DIFFICULTIES,
};

export const DIVISION_LEVELS: LevelDefinition = {
  id: "division",
  type: "division",
  difficulty: LEVEL_DIFFICULTIES,
};

export const MULTIPLICATION_LEVELS: LevelDefinition = {
  id: "multiplication",
  type: "multiplication",
  difficulty: LEVEL_DIFFICULTIES,
};

export function validateLevelDefinition(level: LevelDefinition): void {
  if (!level.id.trim()) throw new Error("Level ID must be non-empty.");
  if (!["addition", "subtraction", "division", "multiplication"].includes(level.type)) {
    throw new Error("Unsupported level type.");
  }
  if (level.difficulty.length !== 5) throw new Error("Exactly five difficulties are required.");
  for (const difficulty of level.difficulty) {
    if (!Number.isInteger(difficulty.firstOperandDigits) || difficulty.firstOperandDigits < 1 ||
        !Number.isInteger(difficulty.secondOperandDigits) || difficulty.secondOperandDigits < 1) {
      throw new Error("Operand digit counts must be positive integers.");
    }
  }
}

for (const level of [ADDITION_LEVELS, SUBTRACTION_LEVELS, DIVISION_LEVELS, MULTIPLICATION_LEVELS]) {
  validateLevelDefinition(level);
}
