export type OperationType = "addition" | "subtraction" | "multiplication" | "division";

export type ArithmeticGameType = "main-game" | "mini-game-1";

export interface ArithmeticProblemParameters {
  readonly operand1Digits: number;
  readonly operand2Digits: number;
  readonly operation: OperationType;
}

export interface MainGameProblemRequest extends ArithmeticProblemParameters {
  readonly gameType: "main-game";
}

export interface MiniGameOneProblemRequest extends ArithmeticProblemParameters {
  readonly gameType: "mini-game-1";
}

export type ArithmeticProblemRequest = MainGameProblemRequest | MiniGameOneProblemRequest;

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

export type ArithmeticProblemResult = MainGameProblem | MiniGameOneProblem;
