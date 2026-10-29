import type { ArithmeticProblemParameters, MiniGameOneProblem } from "../domain/problem.ts";

export interface MiniGameOneProblemGenerator {
  generate(input: ArithmeticProblemParameters): MiniGameOneProblem;
}
