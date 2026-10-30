import type { MainGameProblem, ResolvedProblemParameters } from "../domain/problem.ts";

export interface MainGameProblemGenerator {
  generate(input: ResolvedProblemParameters): MainGameProblem;
}
