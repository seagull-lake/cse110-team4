import type {
  MainGameProblem, MainGameProblemRequest, MiniGameOneProblem,
  MiniGameOneProblemRequest, ProblemRequest, ProblemResult,
} from "../domain/problem.ts";

/** Routes a request to the generator for its game type. */
export interface ProblemEngine {
  generate(request: MainGameProblemRequest): MainGameProblem;
  generate(request: MiniGameOneProblemRequest): MiniGameOneProblem;
  generate(request: ProblemRequest): ProblemResult;
}
