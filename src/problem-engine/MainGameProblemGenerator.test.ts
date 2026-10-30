import { describe, expect, it } from "vitest";
import type { OperationType } from "../domain/problem.ts";
import { MainGameProblemGenerator } from "./MainGameProblemGenerator.ts";

describe("MainGameProblemGenerator", () => {
  it.each([
    ["addition", 13],
    ["subtraction", -7],
    ["multiplication", 30],
    ["division", 0.3],
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
    const input = Object.freeze({
      operation: "addition" as const,
      operandDigits: Object.freeze([1, 2, 3]),
    });
    const problem = new MainGameProblemGenerator(() => random).generate(input);

    expect(problem.operands).toEqual(operands);
    expect(problem.answer).toBe(operands.reduce((sum, value) => sum + value, 0));
  });

  it.each([
    ["addition", 11],
    ["subtraction", 1],
    ["multiplication", 36],
    ["division", 1],
  ] as const)("evaluates multiple operands left to right for %s", (operation, answer) => {
    const values = [0.6, 0.3, 0.2]; // Generates 6, 3, 2.
    const generator = new MainGameProblemGenerator(() => values.shift()!);

    const problem = generator.generate({ operation, operandDigits: [1, 1, 1] });
    const firstResults = { addition: 9, subtraction: 3, multiplication: 18, division: 2 };
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
