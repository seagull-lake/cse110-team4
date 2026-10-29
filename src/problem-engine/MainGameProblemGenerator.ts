import type { ArithmeticProblemParameters, MainGameProblem } from "../domain/problem.ts";

export interface MainGameProblemGenerator {
  generate(input: ArithmeticProblemParameters): MainGameProblem;
}
