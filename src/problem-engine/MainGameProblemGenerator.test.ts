import { describe, expect, it } from "vitest";
import type { OperationType } from "../domain/problem.ts";
import { MainGameProblemGenerator } from "./MainGameProblemGenerator.ts";

describe("MainGameProblemGenerator", () => {

  it.each([
    ["addition", 13],
    ["subtraction", -7],
    ["multiplication", 30],
  ] as const)("generates operands and the %s answer", (operation, answer) => {
    const values = [0.25, 0];
    const generator = new MainGameProblemGenerator(() => values.shift()!);

    const problem = generator.generate({ operation, operandDigits: [1, 2] });
    expect(problem).toMatchObject({
      operands: [3, 10],
      answer,
      solution: {
        finalAnswer: answer,
        steps: [{ operation, leftOperand: 3, rightOperand: 10, result: answer }],
      },
    });
    expect(problem.solution.steps).toHaveLength(1);
  });

  it.each([
    [0, [1, 10, 100]],
    [0.999999, [9, 99, 999]],
  ] as const)("respects each digit count at random value %s", (random, operands) => {
    const input = Object.freeze({operation: "addition" as const, operandDigits: Object.freeze([1, 2, 3]),});
    const problem = new MainGameProblemGenerator(() => random).generate(input);

    expect(problem.operands).toEqual(operands);
    expect(problem.answer).toBe(operands.reduce((sum, value) => sum + value, 0));
  });

  it.each([["addition", 11],["subtraction", 1],["multiplication", 36],
] as const)("evaluates multiple operands left to right for %s", (operation, answer) => {
    const values = [0.6, 0.3, 0.2]; // Generates 6, 3, 2.
    const generator = new MainGameProblemGenerator(() => values.shift()!);

    const problem = generator.generate({ operation, operandDigits: [1, 1, 1] });
    const firstResults = {addition: 9, subtraction: 3, multiplication: 18, division: 2};
    expect(problem).toMatchObject({
      operands: [6, 3, 2],
      answer,
      solution: {
        finalAnswer: answer,
        steps: [
          { operation, leftOperand: 6, rightOperand: 3, result: firstResults[operation] },
          { operation, leftOperand: firstResults[operation], rightOperand: 2, result: answer },
        ],
      },
    });
    expect(problem.solution.steps).toHaveLength(2);
  });

  it("never generates a zero divisor at the lower random boundary", () => {
    expect(new MainGameProblemGenerator(() => 0).generate({
      operation: "division", operandDigits: [2, 1],
    })).toMatchObject({ operands: [10, 1], answer: 10 });
  });

  it("records carries through every column, including a new leading digit", () => {
    const problem = new MainGameProblemGenerator(() => 0.999999).generate({
      operation: "addition", operandDigits: [2, 2],
    });

    expect(problem.solution).toEqual({
      finalAnswer: 198,
      steps: [{
        operation: "addition", leftOperand: 99, rightOperand: 99, result: 198,
        additionColumns: [
          { placeValue: 1, leftDigit: 9, rightDigit: 9, carryIn: 0, total: 18, resultDigit: 8, carryOut: 1 },
          { placeValue: 10, leftDigit: 9, rightDigit: 9, carryIn: 1, total: 19, resultDigit: 9, carryOut: 1 },
          { placeValue: 100, leftDigit: 0, rightDigit: 0, carryIn: 1, total: 1, resultDigit: 1, carryOut: 0 },
        ],
      }],
    });
  });

  it("records unequal digit counts without introducing carries", () => {
    const problem = new MainGameProblemGenerator(() => 0).generate({
      operation: "addition", operandDigits: [1, 2],
    });

    expect(problem.solution.steps[0].additionColumns).toEqual([
      { placeValue: 1, leftDigit: 1, rightDigit: 0, carryIn: 0, total: 1, resultDigit: 1, carryOut: 0 },
      { placeValue: 10, leftDigit: 0, rightDigit: 1, carryIn: 0, total: 1, resultDigit: 1, carryOut: 0 },
    ]);
    expect(problem.solution.finalAnswer).toBe(11);
  });

  it("starts a fresh carry calculation for each addition", () => {
    const problem = new MainGameProblemGenerator(() => 0.999999).generate({
      operation: "addition", operandDigits: [1, 1, 1],
    });

    expect(problem.solution.steps.map((step) => step.result)).toEqual([18, 27]);
    expect(problem.solution.steps[1].additionColumns).toEqual([
      { placeValue: 1, leftDigit: 8, rightDigit: 9, carryIn: 0, total: 17, resultDigit: 7, carryOut: 1 },
      { placeValue: 10, leftDigit: 1, rightDigit: 0, carryIn: 1, total: 2, resultDigit: 2, carryOut: 0 },
    ]);
    expect(problem.solution.finalAnswer).toBe(27);
  });

  it("records carries across unequal digit counts for 97 + 128", () => {
    const values = [0.97, 0.032];
    const generator = new MainGameProblemGenerator(() => values.shift()!);
    const problem = generator.generate({ operation: "addition", operandDigits: [2, 3] });

    expect(problem.operands).toEqual([97, 128]);
    expect(problem.solution.finalAnswer).toBe(225);
    expect(problem.solution.steps[0].additionColumns).toEqual([
      { placeValue: 1, leftDigit: 7, rightDigit: 8, carryIn: 0, total: 15, resultDigit: 5, carryOut: 1 },
      { placeValue: 10, leftDigit: 9, rightDigit: 2, carryIn: 1, total: 12, resultDigit: 2, carryOut: 1 },
      { placeValue: 100, leftDigit: 0, rightDigit: 1, carryIn: 1, total: 2, resultDigit: 2, carryOut: 0 },
    ]);
  });

  it("records borrowing for 32 - 17", () => {
    const values = [0.25, 0.08];
    const generator = new MainGameProblemGenerator(() => values.shift()!);
    const problem = generator.generate({ operation: "subtraction", operandDigits: [2, 2] });

    expect(problem.operands).toEqual([32, 17]);
    expect(problem.answer).toBe(15);
    expect(problem.solution.finalAnswer).toBe(15);
    expect(problem.solution.steps[0].subtractionColumns).toEqual([
      { placeValue: 1, leftDigit: 2, rightDigit: 7, borrowIn: 0, borrowOut: 1, total: 5, resultDigit: 5 },
      { placeValue: 10, leftDigit: 3, rightDigit: 1, borrowIn: 1, borrowOut: 0, total: 1, resultDigit: 1 },
    ]);
  });

  it("records borrowing across zero digits for 1000 - 1", () => {
    const problem = new MainGameProblemGenerator(() => 0).generate({
      operation: "subtraction", operandDigits: [4, 1],
    });

    expect(problem.answer).toBe(999);
    expect(problem.solution.steps[0].subtractionColumns).toEqual([
      { placeValue: 1, leftDigit: 0, rightDigit: 1, borrowIn: 0, borrowOut: 1, total: 9, resultDigit: 9 },
      { placeValue: 10, leftDigit: 0, rightDigit: 0, borrowIn: 1, borrowOut: 1, total: 9, resultDigit: 9 },
      { placeValue: 100, leftDigit: 0, rightDigit: 0, borrowIn: 1, borrowOut: 1, total: 9, resultDigit: 9 },
      { placeValue: 1000, leftDigit: 1, rightDigit: 0, borrowIn: 1, borrowOut: 0, total: 0, resultDigit: 0 },
    ]);
  });

  it("records subtraction without borrowing for 128 - 7", () => {
    const values = [0.032, 0.7];
    const generator = new MainGameProblemGenerator(() => values.shift()!);
    const problem = generator.generate({ operation: "subtraction", operandDigits: [3, 1] });

    expect(problem.operands).toEqual([128, 7]);
    expect(problem.answer).toBe(121);
    expect(problem.solution.steps[0].subtractionColumns).toEqual([
      { placeValue: 1, leftDigit: 8, rightDigit: 7, borrowIn: 0, borrowOut: 0, total: 1, resultDigit: 1 },
      { placeValue: 10, leftDigit: 2, rightDigit: 0, borrowIn: 0, borrowOut: 0, total: 2, resultDigit: 2 },
      { placeValue: 100, leftDigit: 1, rightDigit: 0, borrowIn: 0, borrowOut: 0, total: 1, resultDigit: 1 },
    ]);
  });

  it("records a zero answer when subtracting equal operands", () => {
    const problem = new MainGameProblemGenerator(() => 0).generate({
      operation: "subtraction", operandDigits: [2, 2],
    });

    expect(problem.operands).toEqual([10, 10]);
    expect(problem.answer).toBe(0);
    expect(problem.solution.finalAnswer).toBe(0);
    expect(problem.solution.steps[0].subtractionColumns).toEqual([
      { placeValue: 1, leftDigit: 0, rightDigit: 0, borrowIn: 0, borrowOut: 0, total: 0, resultDigit: 0 },
      { placeValue: 10, leftDigit: 1, rightDigit: 1, borrowIn: 0, borrowOut: 0, total: 0, resultDigit: 0 },
    ]);
  });

  it("keeps the negative sign while recording larger - smaller for 3 - 10", () => {
    const values = [0.25, 0];
    const generator = new MainGameProblemGenerator(() => values.shift()!);
    const problem = generator.generate({ operation: "subtraction", operandDigits: [1, 2] });

    expect(problem.operands).toEqual([3, 10]);
    expect(problem.answer).toBe(-7);
    expect(problem.solution.steps[0].result).toBe(-7);
    expect(problem.solution.steps[0].subtractionColumns).toEqual([
      { placeValue: 1, leftDigit: 0, rightDigit: 3, borrowIn: 0, borrowOut: 1, total: 7, resultDigit: 7 },
      { placeValue: 10, leftDigit: 1, rightDigit: 0, borrowIn: 1, borrowOut: 0, total: 0, resultDigit: 0 },
    ]);
  });

  it("uses magnitude addition when the running subtraction answer is negative", () => {
    const values = [0.25, 0, 0.2];
    const generator = new MainGameProblemGenerator(() => values.shift()!);
    const problem = generator.generate({ operation: "subtraction", operandDigits: [1, 2, 1] });

    expect(problem.operands).toEqual([3, 10, 2]);
    expect(problem.solution.steps).toHaveLength(2);
    expect(problem.solution.steps[0].result).toBe(-7);
    expect(problem.solution.steps[1]).toMatchObject({
      operation: "subtraction", leftOperand: -7, rightOperand: 2, result: -9,
    });
    expect(problem.solution.steps[1].subtractionColumns).toBeUndefined();
    expect(problem.solution.steps[1].additionColumns).toEqual([
      { placeValue: 1, leftDigit: 7, rightDigit: 2, carryIn: 0, total: 9, resultDigit: 9, carryOut: 0 },
    ]);
    expect(problem.solution.finalAnswer).toBe(-9);
  });

  it("handles subtraction after the running answer becomes zero", () => {
    const problem = new MainGameProblemGenerator(() => 0).generate({
      operation: "subtraction", operandDigits: [2, 2, 1],
    });

    expect(problem.operands).toEqual([10, 10, 1]);
    expect(problem.solution.steps[0].result).toBe(0);
    expect(problem.solution.steps[1].result).toBe(-1);
    expect(problem.solution.steps[1].subtractionColumns).toEqual([
      { placeValue: 1, leftDigit: 1, rightDigit: 0, borrowIn: 0, borrowOut: 0, total: 1, resultDigit: 1 },
    ]);
    expect(problem.solution.finalAnswer).toBe(-1);
  });

  it("records multiplication carries and shifted rows for 97 x 12", () => {
    const values = [0.97, 0.025];
    const generator = new MainGameProblemGenerator(() => values.shift()!);
    const problem = generator.generate({ operation: "multiplication", operandDigits: [2, 2] });

    expect(problem.operands).toEqual([97, 12]);
    expect(problem.answer).toBe(1164);
    expect(problem.solution.steps[0].multiplicationRows).toEqual([
      {
        multiplierDigit: 2,
        multiplierPlaceValue: 1,
        partialProduct: 194,
        runningTotal: 194,
        columns: [
          { placeValue: 1, leftDigit: 7, rightDigit: 2, carryIn: 0, total: 14, resultDigit: 4, carryOut: 1 },
          { placeValue: 10, leftDigit: 9, rightDigit: 2, carryIn: 1, total: 19, resultDigit: 9, carryOut: 1 },
          { placeValue: 100, leftDigit: 0, rightDigit: 2, carryIn: 1, total: 1, resultDigit: 1, carryOut: 0 },
        ],
      },
      {
        multiplierDigit: 1,
        multiplierPlaceValue: 10,
        partialProduct: 970,
        runningTotal: 1164,
        columns: [
          { placeValue: 10, leftDigit: 7, rightDigit: 1, carryIn: 0, total: 7, resultDigit: 7, carryOut: 0 },
          { placeValue: 100, leftDigit: 9, rightDigit: 1, carryIn: 0, total: 9, resultDigit: 9, carryOut: 0 },
        ],
        additionColumns: [
          { placeValue: 1, leftDigit: 4, rightDigit: 0, carryIn: 0, total: 4, resultDigit: 4, carryOut: 0 },
          { placeValue: 10, leftDigit: 9, rightDigit: 7, carryIn: 0, total: 16, resultDigit: 6, carryOut: 1 },
          { placeValue: 100, leftDigit: 1, rightDigit: 9, carryIn: 1, total: 11, resultDigit: 1, carryOut: 1 },
          { placeValue: 1000, leftDigit: 0, rightDigit: 0, carryIn: 1, total: 1, resultDigit: 1, carryOut: 0 },
        ],
      },
    ]);
  });

  it("keeps a zero digit's partial-product row in 23 x 101", () => {
    const values = [0.15, 0.002];
    const generator = new MainGameProblemGenerator(() => values.shift()!);
    const problem = generator.generate({ operation: "multiplication", operandDigits: [2, 3] });

    expect(problem.operands).toEqual([23, 101]);
    expect(problem.answer).toBe(2323);
    expect(problem.solution.steps[0].multiplicationRows).toMatchObject([
      { multiplierDigit: 1, multiplierPlaceValue: 1, partialProduct: 23, runningTotal: 23 },
      {
        multiplierDigit: 0, multiplierPlaceValue: 10, partialProduct: 0, runningTotal: 23,
        columns: [
          { placeValue: 10, leftDigit: 3, rightDigit: 0, carryIn: 0, total: 0, resultDigit: 0, carryOut: 0 },
          { placeValue: 100, leftDigit: 2, rightDigit: 0, carryIn: 0, total: 0, resultDigit: 0, carryOut: 0 },
        ],
      },
      { multiplierDigit: 1, multiplierPlaceValue: 100, partialProduct: 2300, runningTotal: 2323 },
    ]);
  });

  it("starts fresh multiplication records for each calculation in 9 x 9 x 9", () => {
    const problem = new MainGameProblemGenerator(() => 0.999999).generate({
      operation: "multiplication", operandDigits: [1, 1, 1],
    });

    expect(problem.solution.steps).toHaveLength(2);
    const firstRows = problem.solution.steps[0].multiplicationRows;
    const secondRows = problem.solution.steps[1].multiplicationRows;
    if (firstRows === undefined || secondRows === undefined) {
      throw new Error("Expected multiplication rows for both steps.");
    }
    expect(firstRows).toHaveLength(1);
    expect(secondRows).toHaveLength(1);
    expect(firstRows[0].partialProduct).toBe(81);
    expect(secondRows[0].partialProduct).toBe(729);
    expect(secondRows[0].columns).toEqual([
      { placeValue: 1, leftDigit: 1, rightDigit: 9, carryIn: 0, total: 9, resultDigit: 9, carryOut: 0 },
      { placeValue: 10, leftDigit: 8, rightDigit: 9, carryIn: 0, total: 72, resultDigit: 2, carryOut: 7 },
      { placeValue: 100, leftDigit: 0, rightDigit: 9, carryIn: 7, total: 7, resultDigit: 7, carryOut: 0 },
    ]);
    expect(problem.solution.finalAnswer).toBe(729);
  });

  it("records the addition of zero partial products in 100 x 100", () => {
    const problem = new MainGameProblemGenerator(() => 0).generate({
      operation: "multiplication", operandDigits: [3, 3],
    });

    expect(problem.solution.steps[0].multiplicationRows).toMatchObject([
      { multiplierDigit: 0, multiplierPlaceValue: 1, partialProduct: 0, runningTotal: 0 },
      {
        multiplierDigit: 0, multiplierPlaceValue: 10, partialProduct: 0, runningTotal: 0,
        additionColumns: [
          { placeValue: 1, leftDigit: 0, rightDigit: 0, carryIn: 0, total: 0, resultDigit: 0, carryOut: 0 },
        ],
      },
      { multiplierDigit: 1, multiplierPlaceValue: 100, partialProduct: 10000, runningTotal: 10000 },
    ]);
    expect(problem.solution.finalAnswer).toBe(10000);
  });

  it("records a single row without carrying when multiplying by 1", () => {
    const values = [0.9999999999999999, 0];
    const generator = new MainGameProblemGenerator(() => values.shift()!);
    const problem = generator.generate({ operation: "multiplication", operandDigits: [15, 1] });

    expect(problem.operands).toEqual([999999999999999, 1]);
    const rows = problem.solution.steps[0].multiplicationRows;
    if (rows === undefined) {
      throw new Error("Expected multiplication rows.");
    }
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.partialProduct).toBe(999999999999999);
    expect(row.runningTotal).toBe(problem.answer);
    expect(row.columns).toHaveLength(15);
    expect(row.additionColumns).toBeUndefined();
    for (const column of row.columns) {
      expect(column.resultDigit).toBe(9);
      expect(column.carryIn).toBe(0);
      expect(column.carryOut).toBe(0);
    }
  });

  it("rejects a product that overflows instead of looping forever", () => {
    const operandDigits: number[] = [];
    for (let i = 0; i < 22; i++) {
      operandDigits.push(15);
    }

    expect(() => new MainGameProblemGenerator(() => 0.999999).generate({
      operation: "multiplication", operandDigits,
    })).toThrow("Multiplication result is too large");
  });

  it("builds 19764 divided by 12 from the divisor and a four-digit quotient", () => {
    const values = [0.025, 0.1085]; // Divisor 12, then quotient 1647.
    const generator = new MainGameProblemGenerator(() => values.shift()!);
    const problem = generator.generate({ operation: "division", operandDigits: [5, 2] });

    expect(problem.operands).toEqual([19764, 12]);
    expect(problem.answer).toBe(1647);
    expect(problem.solution.finalAnswer).toBe(1647);
    expect(problem.solution.steps[0].divisionBoxMethod).toEqual({
      dividend: 19764,
      divisor: 12,
      boxes: [
        { placeValue: 1000, partialQuotient: 1000, startingAmount: 19764, amountSubtracted: 12000, remainingAmount: 7764, runningQuotient: 1000 },
        { placeValue: 100, partialQuotient: 600, startingAmount: 7764, amountSubtracted: 7200, remainingAmount: 564, runningQuotient: 1600 },
        { placeValue: 10, partialQuotient: 40, startingAmount: 564, amountSubtracted: 480, remainingAmount: 84, runningQuotient: 1640 },
        { placeValue: 1, partialQuotient: 7, startingAmount: 84, amountSubtracted: 84, remainingAmount: 0, runningQuotient: 1647 },
      ],
      partialQuotients: [1000, 600, 40, 7],
      quotientDigits: [1, 6, 4, 7],
      quotient: 1647,
      remainder: 0,
    });
  });

  it("builds 144 divided by 12 with no remainder", () => {
    const values = [0.025, 0.04];
    const generator = new MainGameProblemGenerator(() => values.shift()!);
    const problem = generator.generate({ operation: "division", operandDigits: [3, 2] });

    expect(problem.operands).toEqual([144, 12]);
    expect(problem.solution.steps[0].divisionBoxMethod).toEqual({
      dividend: 144,
      divisor: 12,
      boxes: [
        { placeValue: 10, partialQuotient: 10, startingAmount: 144, amountSubtracted: 120, remainingAmount: 24, runningQuotient: 10 },
        { placeValue: 1, partialQuotient: 2, startingAmount: 24, amountSubtracted: 24, remainingAmount: 0, runningQuotient: 12 },
      ],
      partialQuotients: [10, 2], quotientDigits: [1, 2], quotient: 12, remainder: 0,
    });
  });

  it("keeps zero quotient digits without creating empty subtraction boxes", () => {
    const values = [0, 0.00025];
    const generator = new MainGameProblemGenerator(() => values.shift()!);
    const problem = generator.generate({ operation: "division", operandDigits: [5, 2] });

    expect(problem.operands).toEqual([10020, 10]);
    expect(problem.solution.steps[0].divisionBoxMethod).toEqual({
      dividend: 10020,
      divisor: 10,
      boxes: [
        { placeValue: 1000, partialQuotient: 1000, startingAmount: 10020, amountSubtracted: 10000, remainingAmount: 20, runningQuotient: 1000 },
        { placeValue: 1, partialQuotient: 2, startingAmount: 20, amountSubtracted: 20, remainingAmount: 0, runningQuotient: 1002 },
      ],
      partialQuotients: [1000, 2], quotientDigits: [1, 0, 0, 2], quotient: 1002, remainder: 0,
    });
  });

  it("generates the smallest positive exact division at the lower random boundary", () => {
    const problem = new MainGameProblemGenerator(() => 0).generate({
      operation: "division", operandDigits: [1, 1],
    });

    expect(problem.operands).toEqual([1, 1]);
    expect(problem.answer).toBe(1);
    expect(problem.solution.steps[0].divisionBoxMethod).toMatchObject({
      quotient: 1, remainder: 0, quotientDigits: [1],
    });
  });

  it("generates a four-digit quotient at the upper random boundary", () => {
    const values = [0, 0.999999];
    const generator = new MainGameProblemGenerator(() => values.shift()!);
    const problem = generator.generate({ operation: "division", operandDigits: [5, 1] });
    const division = problem.solution.steps[0].divisionBoxMethod;
    if (division === undefined) {
      throw new Error("Expected division boxes.");
    }

    expect(problem.operands).toEqual([19998, 2]);
    expect(division.quotient).toBe(9999);
    expect(division.quotientDigits).toEqual([9, 9, 9, 9]);
    expect(division.partialQuotients).toEqual([9000, 900, 90, 9]);
    expect(division.boxes).toHaveLength(4);
    expect(division.remainder).toBe(0);
    for (const box of division.boxes) {
      expect(box.isCombined).toBeUndefined();
    }
  });

  it("uses the first two digit counts and still generates a two-operand division", () => {
    const values = [0.25, 0.367];
    const generator = new MainGameProblemGenerator(() => values.shift()!);
    const problem = generator.generate({ operation: "division", operandDigits: [3, 1, 1] });

    expect(problem.operands).toEqual([432, 3]);
    expect(problem.solution.steps).toHaveLength(1);
    expect(problem.solution.steps[0]).toMatchObject({
      leftOperand: 432, rightOperand: 3, result: 144,
      divisionBoxMethod: { quotient: 144, remainder: 0, partialQuotients: [100, 40, 4] },
    });
    expect(problem.solution.finalAnswer).toBe(144);
  });

  it("preserves large operand digit counts while limiting the quotient to four digits", () => {
    const problem = new MainGameProblemGenerator(() => 0.9999999999999999).generate({
      operation: "division", operandDigits: [15, 11],
    });

    expect(problem.operands).toEqual([999899999990001, 99999999999]);
    expect(problem.answer).toBe(9999);
    expect(problem.solution.steps[0].divisionBoxMethod).toMatchObject({
      quotient: 9999, quotientDigits: [9, 9, 9, 9], remainder: 0,
    });
  });

  it.each([
    { operandDigits: [1, 2] },
    { operandDigits: [6, 1] },
    { operandDigits: [15, 1] },
  ])("rejects digit counts incompatible with a four-digit integer quotient: $operandDigits", ({ operandDigits }) => {
    expect(() => new MainGameProblemGenerator(() => 0).generate({
      operation: "division", operandDigits,
    })).toThrow("Division digit counts cannot produce an exact division");
  });

  it.each([0, 0.999999])("satisfies requested division digit counts at random boundary %s", (random) => {
    const configurations = [[1, 1], [2, 1], [3, 1, 1], [5, 2], [5, 1], [8, 4], [15, 11], [6, 2, 1], [5, 1, 2], [5, 1, 4], [4, 3, 2, 1]];
    const generator = new MainGameProblemGenerator(() => random);

    for (const operandDigits of configurations) {
      const problem = generator.generate({ operation: "division", operandDigits });
      expect(problem.operands).toHaveLength(2);
      expect(String(problem.operands[0]).length).toBe(operandDigits[0]);
      expect(String(problem.operands[1]).length).toBe(operandDigits[1]);
      expect(problem.operands[1]).toBeGreaterThanOrEqual(1);
      for (const step of problem.solution.steps) {
        expect(step.leftOperand % step.rightOperand).toBe(0);
        expect(Number.isInteger(step.result)).toBe(true);
        expect(step.result).toBeGreaterThanOrEqual(1);
        expect(step.result).toBeLessThanOrEqual(9999);
        expect(step.divisionBoxMethod).toMatchObject({ quotient: step.result, remainder: 0 });
      }
    }
  });

  it("keeps exact division, requested digit counts, and box transitions correct across 500 questions", () => {
    const configurations = [[1, 1], [2, 1], [3, 1, 1], [5, 2], [5, 1], [8, 4], [15, 11], [6, 2, 1], [5, 1, 2], [5, 1, 4], [4, 3, 2, 1]];
    let random = 0;
    const generator = new MainGameProblemGenerator(() => {
      random = (random + 0.137) % 1;
      return random;
    });

    for (let i = 0; i < 500; i++) {
      const operandDigits = configurations[i % configurations.length];
      const problem = generator.generate({ operation: "division", operandDigits });
      expect(problem.operands).toHaveLength(2);
      expect(problem.solution.steps).toHaveLength(1);
      expect(String(problem.operands[0]).length).toBe(operandDigits[0]);
      expect(String(problem.operands[1]).length).toBe(operandDigits[1]);
      expect(problem.operands[1]).toBeGreaterThanOrEqual(1);
      expect(problem.operands[0]).toBe(problem.operands[1] * problem.answer);
      for (const step of problem.solution.steps) {
        const division = step.divisionBoxMethod;
        if (division === undefined) {
          throw new Error("Expected division boxes.");
        }

        expect(division.quotient * division.divisor).toBe(division.dividend);
        expect(division.dividend % division.divisor).toBe(0);
        expect(division.quotient).toBeGreaterThanOrEqual(1);
        expect(division.quotient).toBeLessThanOrEqual(9999);
        expect(division.remainder).toBe(0);
        expect(step.result).toBe(division.quotient);
        expect(division.boxes.length).toBeLessThanOrEqual(4);
        expect(division.quotientDigits.length).toBeLessThanOrEqual(4);
        expect(division.partialQuotients).toHaveLength(division.boxes.length);

        let quotientFromDigits = 0;
        for (const digit of division.quotientDigits) {
          quotientFromDigits = quotientFromDigits * 10 + digit;
        }
        expect(quotientFromDigits).toBe(division.quotient);
        let amountLeft = division.dividend;
        let quotientSoFar = 0;
        for (const box of division.boxes) {
          expect(box.startingAmount).toBe(amountLeft);
          expect(box.amountSubtracted).toBe(division.divisor * box.partialQuotient);
          expect(box.remainingAmount).toBe(box.startingAmount - box.amountSubtracted);
          expect(box.partialQuotient).toBeGreaterThan(0);
          amountLeft = box.remainingAmount;
          quotientSoFar += box.partialQuotient;
          expect(box.runningQuotient).toBe(quotientSoFar);
        }
        expect(amountLeft).toBe(0);
        expect(quotientSoFar).toBe(division.quotient);
      }
      expect(problem.answer).toBe(problem.solution.steps[problem.solution.steps.length - 1].result);
    }
  });

  it("does not change frozen division input", () => {
    const input = Object.freeze({
      operation: "division" as const,
      operandDigits: Object.freeze([5, 2, 1]),
    });
    const problem = new MainGameProblemGenerator(() => 0).generate(input);

    expect(input).toEqual({ operation: "division", operandDigits: [5, 2, 1] });
    expect(problem.operands).toEqual([10000, 10]);
    expect(problem.answer).toBe(1000);
  });

  it("returns independent operands and solution records for separate questions", () => {
    const generator = new MainGameProblemGenerator(() => 0);
    const first = generator.generate({ operation: "addition", operandDigits: [2, 1] });
    const second = generator.generate({ operation: "multiplication", operandDigits: [2, 1] });

    expect(first).toMatchObject({ operands: [10, 1], answer: 11, solution: { finalAnswer: 11 } });
    expect(second).toMatchObject({ operands: [10, 1], answer: 10, solution: { finalAnswer: 10 } });
    expect(second.operands).not.toBe(first.operands);
    expect(second.solution.steps).not.toBe(first.solution.steps);
    expect(second.solution.steps[0]).not.toBe(first.solution.steps[0]);
    expect(first.solution.steps[0].multiplicationRows).toBeUndefined();
    expect(second.solution.steps[0].additionColumns).toBeUndefined();
  });

  it.each(["subtraction", "multiplication", "division"] as const)("validates digit counts before generating %s", (operation) => {
    expect(() => new MainGameProblemGenerator(() => 0).generate({
      operation, operandDigits: [2, 0],
    })).toThrow("Operand digit counts");
  });

  it.each([{ operandDigits: [] }, { operandDigits: [1] }])("rejects too few operands: $operandDigits", ({ operandDigits }) => {
    expect(() => new MainGameProblemGenerator().generate({
      operation: "addition", operandDigits,
    })).toThrow("at least two operands");
  });

  it.each([0, -1, 1.5, NaN, Infinity, 16])("rejects invalid digit count %s", (digits) => {
    expect(() => new MainGameProblemGenerator().generate({
      operation: "addition", operandDigits: [1, digits],
    })).toThrow("Operand digit counts");
  });

  it("rejects an unsupported operation", () => {
    expect(() => new MainGameProblemGenerator().generate({
      operation: "unknown" as OperationType, operandDigits: [1, 1],
    })).toThrow("Unsupported operation");
  });
});
