import type { ProblemRequest, ProblemResult } from "../domain/problem.ts";

/** Each array contains the digit count of each operand. */
export interface ProblemDifficultyConfig {
  mainGame: { [difficulty: number]: readonly number[] };
  miniGameOne: { [difficulty: number]: readonly [number, number] };
}

// Main-game operand counts are fixed; level owners will tune the digit counts.
export const problemDifficultyConfig: ProblemDifficultyConfig = {
  mainGame: {
    1: [1, 1],
    2: [1, 1],
    3: [1, 1],
    4: [1, 1, 1],
    5: [1, 1, 1],
  },
  miniGameOne: { 1: [1, 1] },
};

/** Contract for routing a game request to the matching arithmetic generator. */
export interface ProblemDispatcher {
  generate(request: ProblemRequest): ProblemResult;
}
