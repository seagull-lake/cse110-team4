import { describe, expect, it } from "vitest";
import { checkAnswer, generateBatch, generateLevelProblem as generateProblem, getLevelConfig, isWholeNumber, LEVELS, OPERATIONS } from "./ProblemGenerator.ts";
import type { DifficultyLevel, Operation } from "./ProblemGenerator.ts";

function expectInRange(value: number, min: number, max: number): void {
  expect(value).toBeGreaterThanOrEqual(min);
  expect(value).toBeLessThanOrEqual(max);
}


function testRandom(): () => number {
  let value = 0;
  return function () {
    value = (value + 37) % 101;
    return value / 101;
  };
}

describe("Problems for every operation and difficulty level", () => {
  for (const operation of OPERATIONS) {
    for (const config of LEVELS) {
      it(`${operation}, level ${config.level}: 500 questions`, () => {
        const random = testRandom();
        for (let i = 0; i < 500; i++) {
          const problem = generateProblem(operation, config.level, random);
          const left = problem.operands[0];
          const right = problem.operands[1];
          expect(problem.operation).toBe(operation);
          expect(problem.level).toBe(config.level);
          expect(Number.isSafeInteger(problem.answer)).toBe(true);
          expect(problem.answer).toBeGreaterThanOrEqual(0);

          if (operation === "addition" || operation === "subtraction") {
            expectInRange(left, config.additionSubtraction[0], config.additionSubtraction[1]);
            expectInRange(right, config.additionSubtraction[0], config.additionSubtraction[1]);
            if (operation === "addition") {
              expect(problem.answer).toBe(left + right);
            } else {
              expect(problem.answer).toBe(left - right);
            }
          } else if (operation === "multiplication") {
            expectInRange(left, config.multiplication[0][0], config.multiplication[0][1]);
            expectInRange(right, config.multiplication[1][0], config.multiplication[1][1]);
            expect(problem.answer).toBe(left * right);
          } else {
            expectInRange(left, config.division.dividend[0], config.division.dividend[1]);
            expectInRange(right, config.division.divisor[0], config.division.divisor[1]);
            expect(right).toBeGreaterThan(0);
            expect(left % right).toBe(0);
            expect(problem.answer).toBe(left / right);
          }
        }
      });
    }
  }

  it("preserves the number ranges for all five levels", () => {
    expect(LEVELS.map(config => config.additionSubtraction)).toEqual([[0,10], [10,99], [100,999], [1000,9999], [10000,99999]]);
    expect(LEVELS.map(config => config.multiplication)).toEqual([[[0,5],[0,5]], [[0,10],[0,10]], [[10,99],[2,9]], [[100,999],[2,9]], [[10,99],[10,99]]]);
    expect(LEVELS.map(config => config.division.dividend)).toEqual([[0,25], [0,100], [10,99], [100,999], [1000,9999]]);
    expect(LEVELS.map(config => config.division.divisor)).toEqual([[1,5], [2,10], [2,9], [2,9], [2,9]]);
  });

  it("stays within range at both random boundaries", () => {
    for (const config of LEVELS) {
      for (const value of [0, 1 - Number.EPSILON]) {
        const addition = generateProblem("addition", config.level, () => value);
        const multiplication = generateProblem("multiplication", config.level, () => value);
        let endpoint = 0;
        if (value > 0) endpoint = 1;
        expect(addition.operands).toEqual([config.additionSubtraction[endpoint], config.additionSubtraction[endpoint]]);
        expect(multiplication.operands).toEqual([config.multiplication[0][endpoint], config.multiplication[1][endpoint]]);
        const division = generateProblem("division", config.level, () => value);
        expectInRange(division.operands[0], config.division.dividend[0], config.division.dividend[1]);
        expectInRange(division.operands[1], config.division.divisor[0], config.division.divisor[1]);
        expect(division.operands[0] % division.operands[1]).toBe(0);
      }
    }
  });

  it("swaps subtraction operands to avoid negative answers", () => {
    let calls = 0;
    function random(): number {
      calls++;
      if (calls === 1) return 0;
      return 0.9999;
    }
    expect(generateProblem("subtraction", 2, random)).toMatchObject({ operands: [99, 10], answer: 89, expression: "99 − 10" });
  });

  it("generates zero answers with the correct operation symbols", () => {
    expect(generateProblem("addition", 1, () => 0)).toMatchObject({ expression: "0 + 0", answer: 0 });
    expect(generateProblem("subtraction", 1, () => 0)).toMatchObject({ expression: "0 − 0", answer: 0 });
    expect(generateProblem("multiplication", 1, () => 0)).toMatchObject({ expression: "0 × 0", answer: 0 });
    expect(generateProblem("division", 1, () => 0)).toMatchObject({ expression: "0 ÷ 1", answer: 0 });
  });

  it("reproduces the same problems with a fixed random sequence", () => {
    const first = generateBatch("multiplication", 3, 30, testRandom());
    const second = generateBatch("multiplication", 3, 30, testRandom());
    expect(first).toEqual(second);
    expect(new Set(first.map(problem => problem.expression)).size).toBeGreaterThan(20);
  });

  it("returns independent level configurations", () => {
    const config = getLevelConfig(1);
    config.additionSubtraction[0] = -10;
    expect(getLevelConfig(1).additionSubtraction).toEqual([0, 10]);
  });

  it("generates problems using the default random source", () => {
    const problem = generateProblem("addition", 1);
    expectInRange(problem.operands[0], 0, 10);
    expectInRange(problem.operands[1], 0, 10);
  });
});

describe("Input validation and batch generation", () => {
  it.each([0, 6, -1, 1.5, NaN, Infinity, "1", null, undefined])("rejects invalid level %s", level => {
    expect(() => generateProblem("addition", level as DifficultyLevel)).toThrow(RangeError);
  });
  it.each(["power", "", null, undefined, "toString"])("rejects invalid operation %s", operation => {
    expect(() => generateProblem(operation as Operation, 1)).toThrow(RangeError);
  });
  it.each([-0.1, 1, NaN, Infinity, -Infinity])("rejects invalid random value %s", value => {
    expect(() => generateProblem("addition", 1, () => value)).toThrow(RangeError);
  });
  it.each([0, -1, 101, 2.5, NaN, Infinity])("rejects invalid problem count %s", count => {
    expect(() => generateBatch("addition", 1, count)).toThrow(RangeError);
  });
  it("generates 1 to 100 problems as independent objects", () => {
    expect(generateBatch("addition", 1, 1)).toHaveLength(1);
    const problems = generateBatch("division", 5, 100, () => 0);
    expect(problems).toHaveLength(100);
    for (const problem of problems) {
      expect(problem.operation).toBe("division");
      expect(problem.level).toBe(5);
    }
    expect(problems[0]).not.toBe(problems[1]);
  });
  it("validates the operation and level for batch generation", () => {
    expect(() => generateBatch("bad" as Operation, 1, 5)).toThrow(RangeError);
    expect(() => generateBatch("addition", 0 as DifficultyLevel, 5)).toThrow(RangeError);
  });
});

describe("Answer checking", () => {
  const zero = generateProblem("addition", 1, () => 0);
  const twenty = generateProblem("addition", 1, () => 0.9999);
  it.each(["20", " 20 ", "020", 20])("accepts correct answer %s", input => {
    expect(checkAnswer(twenty, input)).toBe(true);
  });
  it.each(["", " ", "0x0", "0abc", "0.0", "0e0", "Infinity", "-0", "1", NaN, Infinity, 0.1])("rejects invalid input or incorrect answer %s", input => {
    expect(checkAnswer(zero, input)).toBe(false);
  });
  it("accepts zero", () => {
    expect(checkAnswer(zero, "0")).toBe(true);
    expect(checkAnswer(zero, 0)).toBe(true);
  });
  it("checks each character and allows digits with surrounding whitespace", () => {
    expect(isWholeNumber(" 123 ")).toBe(true);
    expect(isWholeNumber("12 3")).toBe(false);
    expect(isWholeNumber("12a")).toBe(false);
    expect(isWholeNumber("")).toBe(false);
  });
});
