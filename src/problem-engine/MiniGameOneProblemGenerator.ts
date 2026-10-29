import type { MiniGameOneProblem, ProblemParameters } from "../domain/problem.ts";

export interface MiniGameOneProblemGenerator {
  generate(input: ProblemParameters): MiniGameOneProblem;
}
