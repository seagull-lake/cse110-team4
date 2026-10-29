import type {
  MainGameProblem, MainGameProblemRequest, MiniGameOneProblem,
  MiniGameOneProblemRequest, ArithmeticProblemRequest, ArithmeticProblemResult,
} from "../domain/problem.ts";

/** Routes a request to the generator for its game type. */
export interface ArithmeticProblemEngine {
  generate(request: MainGameProblemRequest): MainGameProblem;
  generate(request: MiniGameOneProblemRequest): MiniGameOneProblem;
  generate(request: ArithmeticProblemRequest): ArithmeticProblemResult;
}
