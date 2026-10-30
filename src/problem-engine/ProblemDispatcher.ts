import type { ProblemRequest, ProblemResult } from "../domain/problem.ts";
import type { MainGameProblemGenerator } from "./MainGameProblemGenerator.ts";
import type { MiniGameOneProblemGenerator } from "./MiniGameOneProblemGenerator.ts";

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

/** Resolves difficulty parameters and routes requests to the matching generator. */
export class ProblemDispatcher {
  private readonly mainGame: MainGameProblemGenerator;
  private readonly miniGameOne: MiniGameOneProblemGenerator;
  private readonly config: ProblemDifficultyConfig;

  constructor(
    mainGame: MainGameProblemGenerator,
    miniGameOne: MiniGameOneProblemGenerator,
    config: ProblemDifficultyConfig = problemDifficultyConfig,
  ) {
    this.mainGame = mainGame;
    this.miniGameOne = miniGameOne;
    this.config = config;
  }

  generate(request: ProblemRequest): ProblemResult {
    if (!Number.isInteger(request.difficulty) || request.difficulty < 1) {
      throw new Error("Difficulty must be a positive integer.");
    }
    switch (request.gameType) {
      case "main-game": {
        const operandDigits = this.config.mainGame[request.difficulty];
        if (!operandDigits) {
          throw new Error(`Unconfigured main-game difficulty: ${request.difficulty}`);
        }
        return this.mainGame.generate({ operandDigits, operation: request.operation });
      }
      case "mini-game-1": {
        const operandDigits = this.config.miniGameOne[request.difficulty];
        if (!operandDigits) {
          throw new Error(`Unconfigured mini-game-1 difficulty: ${request.difficulty}`);
        }
        if (operandDigits.length !== 2) {
          throw new Error("Mini-game-1 requires exactly two operands.");
        }
        return this.miniGameOne.generate({ operandDigits, operation: "multiplication" });
      }
      default:
        throw new Error("Unsupported game type.");
    }
  }
}
