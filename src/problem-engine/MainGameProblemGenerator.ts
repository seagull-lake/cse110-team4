import type { MainGameProblem, OperationType, ResolvedProblemParameters } from "../domain/problem.ts";

// One addition column, starting at the ones place (placeValue = 1). 
export interface AdditionColumn {
  readonly placeValue: number; 
  readonly leftDigit: number;
  readonly rightDigit: number;
  readonly carryIn: number;
  readonly total: number;
  readonly resultDigit: number;
  readonly carryOut: number;
}

// One subtraction column. For a negative answer, the columns explain larger - smaller.
export interface SubtractionColumn {
  readonly placeValue: number;
  readonly leftDigit: number;
  readonly rightDigit: number;
  readonly borrowIn: number;
  readonly borrowOut: number;
  readonly total: number;
  readonly resultDigit: number;
}

// One digit multiplication, including the carry into and out of the column.
export interface MultiplicationColumn {
  readonly placeValue: number;
  readonly leftDigit: number;
  readonly rightDigit: number;
  readonly carryIn: number;
  readonly total: number;
  readonly resultDigit: number;
  readonly carryOut: number;
}

// One partial-product row and the total after adding it to the previous rows.
export interface MultiplicationRow {
  readonly multiplierDigit: number;
  readonly multiplierPlaceValue: number;
  readonly partialProduct: number;
  readonly columns: readonly MultiplicationColumn[];
  readonly runningTotal: number;
  readonly additionColumns?: readonly AdditionColumn[];
}

// One calculation in the order needed to solve the problem. 
export interface SolutionStep {
  readonly operation: OperationType;
  readonly leftOperand: number;
  readonly rightOperand: number;
  readonly result: number;
  readonly additionColumns?: readonly AdditionColumn[];
  readonly subtractionColumns?: readonly SubtractionColumn[];
  readonly multiplicationRows?: readonly MultiplicationRow[];
}

export interface SolvedMainGameProblem extends MainGameProblem {
  readonly solution: {
    readonly steps: readonly SolutionStep[];
    readonly finalAnswer: number;
  };
}

// Generates arithmetic questions from parameters passed by the dispatcher. 
export class MainGameProblemGenerator {
  private readonly random: () => number;

  //goal is to generate random number, made for testing, default return Math.random
  constructor(random: () => number = Math.random) {
    this.random = random;
  }
  // adds digits from right to left, recording the result digit and carry for each column.
  private getAdditionColumns(left: number, right: number): AdditionColumn[] {
    const columns: AdditionColumn[] = [];
    let carry = 0;
    let placeValue = 1;

    // Multiplication can combine two zero partial products, so record 0 + 0 too.
    if (left === 0 && right === 0) {
      columns.push({
        placeValue: 1, leftDigit: 0, rightDigit: 0, carryIn: 0,
        total: 0, resultDigit: 0, carryOut: 0,
      });
    }

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

  // Records borrowing for larger - smaller, including borrows across zero digits.
  private getSubtractionColumns(left: number, right: number): SubtractionColumn[] {
    // For 3 - 10, record 10 - 3. The step's final result still supplies the minus sign.
    if (left < right) {
      const temporary = left;
      left = right;
      right = temporary;
    }

    const columns: SubtractionColumn[] = [];
    let borrow = 0;
    let placeValue = 1;

    while (left > 0 || right > 0) {
      const leftDigit = left % 10;
      const rightDigit = right % 10;
      let total = leftDigit - rightDigit - borrow;
      let borrowOut = 0;

      // If this column is too small, borrow 10 from the next column.
      if (total < 0) {
        total = total + 10;
        borrowOut = 1;
      }

      columns.push({
        placeValue,
        leftDigit,
        rightDigit,
        borrowIn: borrow,
        borrowOut,
        total,
        resultDigit: total,
      });

      left = Math.floor(left / 10);
      right = Math.floor(right / 10);
      borrow = borrowOut;
      placeValue *= 10;
    }

    return columns;
  }

  // Multiplies by each digit of right, records carries, then adds the partial products.
  private getMultiplicationRows(left: number, right: number): MultiplicationRow[] {
    // Avoid an endless digit loop if a very large running product overflows number.
    if (!Number.isFinite(left * right)) {
      throw new Error("Multiplication result is too large to record solution steps.");
    }

    const rows: MultiplicationRow[] = [];
    let multiplierPlaceValue = 1;
    let runningTotal = 0;

    while (right > 0) {
      const multiplierDigit = right % 10;
      const columns: MultiplicationColumn[] = [];
      let remainingLeft = left;
      let carry = 0;
      let placeValue = multiplierPlaceValue;

      // Each row starts with a fresh carry. The place value includes the row's shift.
      while (remainingLeft > 0 || carry > 0) {
        const leftDigit = remainingLeft % 10;
        const total = leftDigit * multiplierDigit + carry;
        const carryOut = Math.floor(total / 10);

        columns.push({
          placeValue,
          leftDigit,
          rightDigit: multiplierDigit,
          carryIn: carry,
          total,
          resultDigit: total % 10,
          carryOut,
        });
        remainingLeft = Math.floor(remainingLeft / 10);
        carry = carryOut;
        placeValue *= 10;
      }

      // For 97 x 12, the rows are 97 x 2 = 194 and 97 x 1 x 10 = 970.
      const partialProduct = left * multiplierDigit * multiplierPlaceValue;
      let additionColumns: AdditionColumn[] | undefined;
      if (rows.length > 0) {
        additionColumns = this.getAdditionColumns(runningTotal, partialProduct);
      }
      runningTotal += partialProduct;

      rows.push({
        multiplierDigit,
        multiplierPlaceValue,
        partialProduct,
        columns,
        runningTotal,
        additionColumns,
      });

      right = Math.floor(right / 10);
      multiplierPlaceValue *= 10;
    }

    return rows;
  }

  // Creates the operands, records the calculation steps, and returns the final answer.
  generate(input: ResolvedProblemParameters): SolvedMainGameProblem {
    if (input.operandDigits.length < 2) {
      throw new Error("A problem requires at least two operands.");
    }
    
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
      let subtractionColumns: SubtractionColumn[] | undefined;
      let multiplicationRows: MultiplicationRow[] | undefined;
      switch (input.operation) {
        case "addition":
          additionColumns = this.getAdditionColumns(leftOperand, operand);
          answer += operand;
          break;
        case "subtraction":
          if (leftOperand < 0) {
            // -7 - 2 = -(7 + 2). Record the addition; answer keeps the negative sign.
            additionColumns = this.getAdditionColumns(-leftOperand, operand);
          } else {
            subtractionColumns = this.getSubtractionColumns(leftOperand, operand);
          }
          answer -= operand;
          break;
        case "multiplication":
          multiplicationRows = this.getMultiplicationRows(leftOperand, operand);
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
        subtractionColumns,
        multiplicationRows,
      });
    }
    return { operands, answer, solution: { steps, finalAnswer: answer } };
  }

  
  
}
