import type { MiniGameOneProblem, ResolvedProblemParameters } from "../domain/problem.ts";

export interface MiniGameOneProblemGenerator {
  generate(input: ResolvedProblemParameters): MiniGameOneProblem;
}
