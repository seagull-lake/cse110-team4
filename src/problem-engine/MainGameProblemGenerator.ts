import type { MainGameProblem, OperationType, ResolvedProblemParameters } from "../domain/problem.ts";

/** One addition column, starting at the ones place (placeValue = 1). */
export interface AdditionColumn {
  readonly placeValue: number;
  readonly leftDigit: number;
  readonly rightDigit: number;
  readonly carryIn: number;
  readonly total: number;
  readonly resultDigit: number;
  readonly carryOut: number;
}

/** One calculation in the order needed to solve the problem. */
export interface SolutionStep {
  readonly operation: OperationType;
  readonly leftOperand: number;
  readonly rightOperand: number;
  readonly result: number;
  readonly additionColumns?: readonly AdditionColumn[];
}

export interface SolvedMainGameProblem extends MainGameProblem {
  readonly solution: {
    readonly steps: readonly SolutionStep[];
    readonly finalAnswer: number;
  };
}

/** Generates arithmetic questions from parameters passed by the dispatcher. */
export class MainGameProblemGenerator {
  private readonly random: () => number;

  // Sets the random number source. Tests can supply one for predictable questions.
  constructor(random: () => number = Math.random) {
    this.random = random;
  }

  // Creates the operands, records the calculation steps, and returns the final answer.
  generate(input: ResolvedProblemParameters): SolvedMainGameProblem {
    if (input.operandDigits.length < 2) {
      throw new Error("A problem requires at least two operands.");
    }
    //limit digit counts so JavaScript can represent every generated integer exactly.
    for (const digits of input.operandDigits) {
      if (!Number.isInteger(digits) || digits < 1 || digits > 15) {
        throw new Error("Operand digit counts must be integers from 1 to 15.");
      }
    }

    const operands: number[] = [];
    for (const digits of input.operandDigits) {
      // For example, two digits gives a range from 10 to 99.
      const minimum = 10 ** (digits - 1);
      const maximum = 10 ** digits - 1;
      const operand = minimum + Math.floor(this.random() * (maximum - minimum + 1));
      operands.push(operand);
    }

    // Start with the first operand, then apply the operation from left to right.
    const steps: SolutionStep[] = [];
    let answer = operands[0];
    for (let i = 1; i < operands.length; i++) {
      const leftOperand = answer;
      const operand = operands[i];
      let additionColumns: AdditionColumn[] | undefined;
      switch (input.operation) {
        case "addition":
          additionColumns = this.getAdditionColumns(leftOperand, operand);
          answer += operand;
          break;
        case "subtraction":
          answer -= operand;
          break;
        case "multiplication":
          answer *= operand;
          break;
        case "division":
          answer /= operand;
          break;
        default:
          throw new Error("Unsupported operation.");
      }

      steps.push({
        operation: input.operation,
        leftOperand,
        rightOperand: operand,
        result: answer,
        additionColumns,
      });
    }

    return { operands, answer, solution: { steps, finalAnswer: answer } };
  }

  // Adds digits from right to left, recording the result digit and carry for each column.
  private getAdditionColumns(left: number, right: number): AdditionColumn[] {
    const columns: AdditionColumn[] = [];
    let carry = 0;
    let placeValue = 1;

    while (left > 0 || right > 0 || carry > 0) {
      const leftDigit = left % 10;
      const rightDigit = right % 10;
      const total = leftDigit + rightDigit + carry;
      const carryOut = Math.floor(total / 10);

      columns.push({
        placeValue,
        leftDigit,
        rightDigit,
        carryIn: carry,
        total,
        resultDigit: total % 10,
        carryOut,
      });

      left = Math.floor(left / 10);
      right = Math.floor(right / 10);
      carry = carryOut;
      placeValue *= 10;
    }

    return columns;
  }
}
