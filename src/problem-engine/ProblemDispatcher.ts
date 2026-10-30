import type { ProblemRequest, ProblemResult } from "../domain/problem.ts";

/** Each array contains the digit count of each operand. */
export interface ProblemDifficultyConfig {
  mainGame: { [difficulty: number]: readonly number[] };
  miniGameOne: { [difficulty: number]: readonly [number, number] };
}

// Starter difficulty. The level owners will add the remaining entries.
export const problemDifficultyConfig: ProblemDifficultyConfig = {
  mainGame: { 1: [1, 1] },
  miniGameOne: { 1: [1, 1] },
};

/** Contract for routing a game request to the matching arithmetic generator. */
export interface ProblemDispatcher {
  generate(request: ProblemRequest): ProblemResult;
}
