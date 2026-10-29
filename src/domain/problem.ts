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

export interface ArithmeticOperands {
  readonly operand1: number;
  readonly operand2: number;
}

export interface MainGameProblem extends ArithmeticOperands {
  readonly answer: number;
}

export interface MiniGameOneAnswerOption<Correct extends boolean = boolean> {
  readonly value: number;
  readonly isCorrect: Correct;
}

export type MiniGameOneAnswers =
  | readonly [MiniGameOneAnswerOption<true>, MiniGameOneAnswerOption<false>, MiniGameOneAnswerOption<false>, MiniGameOneAnswerOption<false>]
  | readonly [MiniGameOneAnswerOption<false>, MiniGameOneAnswerOption<true>, MiniGameOneAnswerOption<false>, MiniGameOneAnswerOption<false>]
  | readonly [MiniGameOneAnswerOption<false>, MiniGameOneAnswerOption<false>, MiniGameOneAnswerOption<true>, MiniGameOneAnswerOption<false>]
  | readonly [MiniGameOneAnswerOption<false>, MiniGameOneAnswerOption<false>, MiniGameOneAnswerOption<false>, MiniGameOneAnswerOption<true>];

export interface MiniGameOneProblem extends ArithmeticOperands {
  readonly answers: MiniGameOneAnswers;
}

export type ArithmeticProblemResult = MainGameProblem | MiniGameOneProblem;
