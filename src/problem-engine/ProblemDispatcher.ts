import {
  ADDITION_LEVELS, DIVISION_LEVELS, MULTIPLICATION_LEVELS, SUBTRACTION_LEVELS,
} from "../levels/levelConfig.ts";
import type { LevelDefinition } from "../levels/levelConfig.ts";
import type {
  OperationType, ProblemRequest, ProblemResult, ResolvedProblemParameters,
} from "../domain/problem.ts";
import type { MainGameProblemGenerator } from "./MainGameProblemGenerator.ts";
import type { MiniGameOneProblemGenerator } from "./MiniGameOneProblemGenerator.ts";

const LEVELS_BY_OPERATION: ReadonlyMap<OperationType, LevelDefinition> = new Map([
  ["addition", ADDITION_LEVELS],
  ["subtraction", SUBTRACTION_LEVELS],
  ["multiplication", MULTIPLICATION_LEVELS],
  ["division", DIVISION_LEVELS],
]);

/** Routes arithmetic game requests after resolving digit counts from difficulty. */
export class ProblemDispatcher {
  private readonly mainGameGenerator: MainGameProblemGenerator;
  private readonly miniGameOneGenerator: MiniGameOneProblemGenerator;

  constructor(
    mainGameGenerator: MainGameProblemGenerator,
    miniGameOneGenerator: MiniGameOneProblemGenerator,
  ) {
    this.mainGameGenerator = mainGameGenerator;
    this.miniGameOneGenerator = miniGameOneGenerator;
  }

  generate(request: ProblemRequest): ProblemResult {
    const input = resolveProblemParameters(request);

    if (request.gameType === "main-game") {
      return this.mainGameGenerator.generate(input);
    }
    if (request.gameType === "mini-game-1") {
      return this.miniGameOneGenerator.generate(input);
    }
    throw new RangeError("Unsupported problem game type.");
  }
}

function resolveProblemParameters(request: ProblemRequest): ResolvedProblemParameters {
  const level = LEVELS_BY_OPERATION.get(request.operation);
  if (!level) throw new RangeError("Unsupported operation.");
  if (!Number.isInteger(request.difficulty) || request.difficulty < 1 ||
      request.difficulty > level.maxDifficulty) {
    throw new RangeError("Difficulty is outside the configured range.");
  }

  return {
    operation: request.operation,
    operand1Digits: Math.ceil((request.difficulty + 1) / 2),
    operand2Digits: Math.ceil(request.difficulty / 2),
  };
}
