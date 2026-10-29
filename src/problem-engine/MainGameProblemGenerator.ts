import type { MainGameProblem, ProblemParameters } from "../domain/problem.ts";

export interface MainGameProblemGenerator {
  generate(input: ProblemParameters): MainGameProblem;
}
