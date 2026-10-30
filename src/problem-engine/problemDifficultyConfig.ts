/** Each entry gives the digit count for each operand at that difficulty. */
export interface ProblemDifficultyConfig {
  readonly mainGame: Readonly<Record<number, readonly number[]>>;
  readonly miniGameOne: Readonly<Record<number, readonly [number, number]>>;
}

/** Starter difficulty; the level owners can extend these maps. */
export const problemDifficultyConfig: ProblemDifficultyConfig = {
  mainGame: {
    1: [1, 1],
  },
  miniGameOne: {
    1: [1, 1],
  },
};
