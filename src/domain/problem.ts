export type OperationType = "addition" | "subtraction" | "multiplication" | "division";

export type GameType = "main-game" | "mini-game-1";

export interface ProblemParameters {
  readonly operand1Digits: number;
  readonly operand2Digits: number;
  readonly operation: OperationType;
}

export interface MainGameProblemRequest extends ProblemParameters {
  readonly gameType: "main-game";
}

export interface MiniGameOneProblemRequest extends ProblemParameters {
  readonly gameType: "mini-game-1";
}

export type ProblemRequest = MainGameProblemRequest | MiniGameOneProblemRequest;

export interface ProblemOperands {
  readonly operand1: number;
  readonly operand2: number;
}

export interface MainGameProblem extends ProblemOperands {
  readonly answer: number;
}

export interface AnswerOption<Correct extends boolean = boolean> {
  readonly value: number;
  readonly isCorrect: Correct;
}

export type MiniGameOneAnswers =
  | readonly [AnswerOption<true>, AnswerOption<false>, AnswerOption<false>, AnswerOption<false>]
  | readonly [AnswerOption<false>, AnswerOption<true>, AnswerOption<false>, AnswerOption<false>]
  | readonly [AnswerOption<false>, AnswerOption<false>, AnswerOption<true>, AnswerOption<false>]
  | readonly [AnswerOption<false>, AnswerOption<false>, AnswerOption<false>, AnswerOption<true>];

export interface MiniGameOneProblem extends ProblemOperands {
  readonly answers: MiniGameOneAnswers;
}

export type ProblemResult = MainGameProblem | MiniGameOneProblem;
