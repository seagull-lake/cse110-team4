export type Operation = "addition" | "subtraction" | "multiplication" | "division";

export interface ProblemGenerationRequest {
  leftDigits: number;
  rightDigits: number;
  operation: Operation;
}

// Shared data for models, views, and controllers; no level or game-state dependency.
export interface GeneratedProblem {
  operation: Operation;
  operands: [number, number];
  expression: string;
  answer: number;
}
