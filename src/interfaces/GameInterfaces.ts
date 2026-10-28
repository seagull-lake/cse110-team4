import type { Operation, ProblemGenerationRequest } from "./ProblemGeneration.ts";
export type { Operation, GeneratedProblem, ProblemGenerationRequest } from "./ProblemGeneration.ts";
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;
type Range = [number, number];

export const OPERATIONS: Operation[] = ["addition", "subtraction", "multiplication", "division"];

export interface LevelConfig {
  level: DifficultyLevel;
  name: string;
  additionSubtraction: Range;
  multiplication: [Range, Range];
  division: { dividend: Range; divisor: Range };
  fractionMaxDenominator?: number;
}

export interface Problem {
  operation: Operation;
  level: DifficultyLevel;
  operands: [number, number];
  expression: string;
  answer: number;
}


export interface Fraction {
  numerator: number;
  denominator: number;
  value: number;
}
export type FractionRelation = "lesser" | "greater" | "equal to";
interface GameRequestBase {
  level: DifficultyLevel;
  configuration?: LevelConfig;
}
export interface MainGameRequest extends GameRequestBase {
  game: "main";
  operation: Operation;
}
export interface MultipleChoiceRequest extends GameRequestBase {
  game: "multiplication-division";
  operation: "multiplication" | "division";
}
export interface FractionRequest extends GameRequestBase {
  game: "fraction";
  comparisonCount?: number;
}
export type GameRequest = MainGameRequest | MultipleChoiceRequest | FractionRequest;
export interface MainGameProblem extends Problem {
  game: "main";
  kind: "fill-in-the-blank";
  prompt: string;
  solution: number;
  hint: string;
  explanation: string;
}
export interface MultipleChoiceProblem extends Problem {
  game: "multiplication-division";
  kind: "multiple-choice";
  prompt: string;
  choices: [number, number, number, number];
  solution: number;
}
export interface FractionProblem {
  game: "fraction";
  kind: "fraction-comparison";
  level: DifficultyLevel;
  reference: Fraction;
  comparisons: Fraction[];
  expression: string;
  prompt: string;
  solution: FractionRelation[];
}
export type GameProblem = MainGameProblem | MultipleChoiceProblem | FractionProblem;
export interface ValidationResult {
  valid: boolean;
  correct: boolean;
  feedback: string;
  solution: number | FractionRelation[];
  hint?: string;
  explanation?: string;
  results?: boolean[];
}

// Digit-based contracts are shared with the minigame MVC, outside the generator folder.
export interface MainGameGenerationRequest extends ProblemGenerationRequest {
  game: "main";
}
export interface MultipleChoiceGenerationRequest extends Omit<ProblemGenerationRequest, "operation"> {
  game: "multiplication-division";
  operation: "multiplication" | "division";
}
export interface FractionGenerationRequest {
  game: "fraction";
  leftDigits: number;
  rightDigits: number;
  comparisonCount?: number;
}
export type GameGenerationRequest =
  MainGameGenerationRequest | MultipleChoiceGenerationRequest | FractionGenerationRequest;
export type MainGameData = Omit<MainGameProblem, "level">;
export type MultipleChoiceGameData = Omit<MultipleChoiceProblem, "level">;
export type FractionGameData = Omit<FractionProblem, "level">;
export type DispatchedProblem = MainGameData | MultipleChoiceGameData | FractionGameData;
