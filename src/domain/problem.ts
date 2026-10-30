export type OperationType = "addition" | "subtraction" | "multiplication" | "division";

export type ProblemGameType = "main-game" | "mini-game-1";

/** The screen supplies the operation and current map difficulty. */
export interface ProblemRequest {
  readonly gameType: ProblemGameType;
  readonly operation: OperationType;
  readonly difficulty: number;
}

/** Internal input passed from the dispatcher to an arithmetic generator. */
export interface ResolvedProblemParameters {
  readonly operandDigits: readonly number[];
  readonly operation: OperationType;
}

export interface MainGameProblem {
  readonly operands: readonly number[];
  readonly answer: number;
}

export interface MiniGameOneProblem {
  readonly operands: readonly number[];
  readonly answers: readonly { readonly value: number; readonly isCorrect: boolean }[];
}

export type ProblemResult = MainGameProblem | MiniGameOneProblem;
