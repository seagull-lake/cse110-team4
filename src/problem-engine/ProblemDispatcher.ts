import type { ProblemRequest, ProblemResult } from "../domain/problem.ts";
import type { MainGameProblemGenerator } from "./MainGameProblemGenerator.ts";
import type { MiniGameOneProblemGenerator } from "./MiniGameOneProblemGenerator.ts";
import { problemDifficultyConfig } from "./problemDifficultyConfig.ts";
import type { ProblemDifficultyConfig } from "./problemDifficultyConfig.ts";

/** Resolves difficulty parameters and routes requests to the matching generator. */
export class ProblemDispatcher {
  private readonly mainGame: Pick<MainGameProblemGenerator, "generate">;
  private readonly miniGameOne: MiniGameOneProblemGenerator;
  private readonly config: ProblemDifficultyConfig;

  constructor(
    mainGame: Pick<MainGameProblemGenerator, "generate">,
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
        if (!operandDigits) throw new Error(`Unconfigured main-game difficulty: ${request.difficulty}`);
        return this.mainGame.generate({ operandDigits, operation: request.operation });
      }
      case "mini-game-1": {
        const operandDigits = this.config.miniGameOne[request.difficulty];
        if (!operandDigits) throw new Error(`Unconfigured mini-game-1 difficulty: ${request.difficulty}`);
        if (operandDigits.length !== 2) throw new Error("Mini-game-1 requires exactly two operands.");
        return this.miniGameOne.generate({ operandDigits, operation: "multiplication" });
      }
      default:
        throw new Error("Unsupported game type.");
    }
  }
}
