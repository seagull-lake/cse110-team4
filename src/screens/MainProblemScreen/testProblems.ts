// Problems for the MainProblemScreen tests
import { MainGameProblemGenerator } from "../../problem-engine/MainGameProblemGenerator.ts";
import type { DivisionBoxMethod, SolvedMainGameProblem } from "../../problem-engine/MainGameProblemGenerator.ts";

/** A division problem with the generator's box method steps, like the dispatcher returns. */
export function solvedDivision(dividend: number, divisor: number): SolvedMainGameProblem {
  const generator = new MainGameProblemGenerator() as unknown as {
    getDivisionBoxMethod(dividend: number, divisor: number): DivisionBoxMethod;
  };
  const divisionBoxMethod = generator.getDivisionBoxMethod(dividend, divisor);
  const answer = dividend / divisor;
  return {
    operands: [dividend, divisor], answer,
    solution: { steps: [{ operation: "division", leftOperand: dividend, rightOperand: divisor, result: answer, divisionBoxMethod }], finalAnswer: answer },
  };
}
