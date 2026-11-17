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

/** An addition, subtraction or multiplication problem with exactly these numbers and the generator's worked steps. */
export function solvedProblem(operation: "addition" | "subtraction" | "multiplication", left: number, right: number): SolvedMainGameProblem {
  const digits = [String(left).length, String(right).length];
  // The generator picks each number as min + floor(random × size), so aim at the middle of the wanted number's slot
  const randoms = [left, right].map((value, index) => {
    const minimum = 10 ** (digits[index] - 1);
    return (value - minimum + 0.5) / (10 ** digits[index] - minimum);
  });
  return new MainGameProblemGenerator(() => randoms.shift() ?? 0).generate({ operation, operandDigits: digits });
}
