/** Public entry point. Game modules consume problems; views and scoring stay outside. */
import { generateProblem as generateLevelProblem, validateOperation } from "./ArithmeticGenerator.ts";
import { getLevelConfig } from "./LevelConfiguration.ts";
import type { Operation, DifficultyLevel, Problem } from "../interfaces/GameInterfaces.ts";

export { generateLevelProblem };
export { generateProblem, generateAnswer } from "./DigitProblemGenerator.ts";
export { generateNumberWithDigits, MAX_OPERAND_DIGITS } from "./NumberGenerator.ts";
export type { GeneratedProblem, ProblemGenerationRequest } from "../interfaces/ProblemGeneration.ts";
export type { GameGenerationRequest, DispatchedProblem } from "../interfaces/GameInterfaces.ts";
export { dispatchProblem } from "./GameInterpreter.ts";
export { getLevelConfig, LEVELS } from "./LevelConfiguration.ts";
export { OPERATIONS } from "../interfaces/GameInterfaces.ts";
export type {
  Operation, DifficultyLevel, LevelConfig, Problem, GameRequest, GameProblem,
  MainGameProblem, MultipleChoiceProblem, FractionProblem, Fraction, FractionRelation,
  ValidationResult,
} from "../interfaces/GameInterfaces.ts";
export { generateGameProblem } from "./GameInterpreter.ts";
export { checkAnswer, isWholeNumber, validateAnswer, checkFractionRelation } from "./Validator.ts";
// 4.use a for loop to generate count problems. Repeated problems are possible.
export function generateBatch(
  operation: Operation,
  level: DifficultyLevel,
  count: number,
  random: () => number = Math.random,
): Problem[] {
  validateOperation(operation);
  getLevelConfig(level);
  if (!Number.isInteger(count) || count < 1 || count > 100) {
    throw new RangeError("Count must be an integer from 1 to 100.");
  }

  const problems: Problem[] = [];
  for (let i = 0; i < count; i++) {
    const problem = generateLevelProblem(operation, level, random);
    problems.push(problem);
  }
  return problems;
}
