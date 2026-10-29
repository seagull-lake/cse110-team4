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
  readonly operand1Digits: number;
  readonly operand2Digits: number;
  readonly operation: OperationType;
}

export interface MainGameProblem {
  readonly operand1: number;
  readonly operand2: number;
  readonly answer: number;
}

export interface MiniGameOneProblem {
  readonly operand1: number;
  readonly operand2: number;
  readonly answers: readonly { readonly value: number; readonly isCorrect: boolean }[];
}

export type ProblemResult = MainGameProblem | MiniGameOneProblem;
