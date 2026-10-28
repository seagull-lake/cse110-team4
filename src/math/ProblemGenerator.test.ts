import { describe, expect, it } from "vitest";
import { checkAnswer, getLevelConfig, LEVELS, OPERATIONS, ProblemGenerator } from "./ProblemGenerator.ts";
import type { DifficultyLevel, Operation } from "./ProblemGenerator.ts";

function seededRandom(seed: number): () => number {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
function within(value: number, range: readonly [number, number]): void {
  expect(value).toBeGreaterThanOrEqual(range[0]);
  expect(value).toBeLessThanOrEqual(range[1]);
}

describe("ProblemGenerator arithmetic and difficulty", () => {
  for (const operation of OPERATIONS) {
    for (const config of LEVELS) {
      it(`${operation} level ${config.level}: correct arithmetic and bounds over 500 seeded samples`, () => {
        const generator = new ProblemGenerator(seededRandom(12345));
        for (let i = 0; i < 500; i++) {
          const problem = generator.generate(operation, config.level);
          const [left, right] = problem.operands;
          expect(problem.operation).toBe(operation);
          expect(problem.level).toBe(config.level);
          [left, right, problem.answer].forEach(value => {
            expect(Number.isSafeInteger(value)).toBe(true);
            expect(value).toBeGreaterThanOrEqual(0);
          });
          switch (operation) {
            case "addition":
            case "subtraction":
              within(left, config.additionSubtraction);
              within(right, config.additionSubtraction);
              expect(problem.answer).toBe(operation === "addition" ? left + right : left - right);
              break;
            case "multiplication":
              within(left, config.multiplication[0]);
              within(right, config.multiplication[1]);
              expect(problem.answer).toBe(left * right);
              break;
            case "division":
              within(left, config.division.dividend);
              within(right, config.division.divisor);
              expect(right).toBeGreaterThan(0);
              expect(left % right).toBe(0);
              expect(problem.answer * right).toBe(left);
          }
        }
      });
    }
  }
  it("enforces the documented five practice bands", () => {
    expect(LEVELS.map(config => config.additionSubtraction)).toEqual([[0,10], [10,99], [100,999], [1000,9999], [10000,99999]]);
    expect(LEVELS.map(config => config.multiplication)).toEqual([[[0,5],[0,5]], [[0,10],[0,10]], [[10,99],[2,9]], [[100,999],[2,9]], [[10,99],[10,99]]]);
    expect(LEVELS.map(config => config.division.dividend)).toEqual([[0,25], [0,100], [10,99], [100,999], [1000,9999]]);
  });
  it("covers both random endpoints without leaving any configured range", () => {
    for (const value of [0, 1 - Number.EPSILON]) {
      for (const config of LEVELS) {
        const generator = new ProblemGenerator(() => value);
        const addition = generator.generate("addition", config.level);
        expect(addition.operands).toEqual([config.additionSubtraction[value === 0 ? 0 : 1], config.additionSubtraction[value === 0 ? 0 : 1]]);
        const multiplication = generator.generate("multiplication", config.level);
        expect(multiplication.operands).toEqual(config.multiplication.map(range => range[value === 0 ? 0 : 1]));
        const division = generator.generate("division", config.level);
        within(division.operands[0], config.division.dividend);
        within(division.operands[1], config.division.divisor);
        expect(division.answer).toBe(value === 0 ? Math.ceil(config.division.dividend[0] / division.operands[1]) : Math.floor(config.division.dividend[1] / division.operands[1]));
      }
    }
  });
  it("orders subtraction operands instead of generating negative answers", () => {
    const values = [0, 0.9999];
    expect(new ProblemGenerator(() => values.shift()!).generate("subtraction", 2)).toMatchObject({ operands: [99, 10], answer: 89, expression: "99 − 10" });
  });
  it("includes zero facts and equal-operand subtraction", () => {
    const generator = new ProblemGenerator(() => 0);
    for (const operation of OPERATIONS) expect(generator.generate(operation, 1).answer).toBe(0);
    expect(generator.generate("division", 1).operands).toEqual([0, 1]);
  });
  it("formats each operation with the correct symbol", () => {
    const generator = new ProblemGenerator(() => 0);
    expect(OPERATIONS.map(op => generator.generate(op, 1).expression)).toEqual(["0 + 0", "0 − 0", "0 × 0", "0 ÷ 1"]);
  });
  it("produces varied, reproducible sequences with an injected source", () => {
    const first = new ProblemGenerator(seededRandom(42)).generateBatch("multiplication", 3, 30);
    const second = new ProblemGenerator(seededRandom(42)).generateBatch("multiplication", 3, 30);
    expect(first).toEqual(second);
    expect(new Set(first.map(problem => problem.expression)).size).toBeGreaterThan(20);
  });
});

describe("Input validation and batch generation", () => {
  it.each([0, 6, -1, 1.5, NaN, Infinity, "1", null, undefined])("rejects invalid level %s", level => {
    expect(() => new ProblemGenerator().generate("addition", level as DifficultyLevel)).toThrow(RangeError);
  });
  it.each(["power", "", null, undefined, "toString"])("rejects unsupported operation %s", operation => {
    expect(() => new ProblemGenerator().generate(operation as Operation, 1)).toThrow(RangeError);
  });
  it.each([-0.1, 1, NaN, Infinity, -Infinity])("rejects invalid random value %s", value => {
    expect(() => new ProblemGenerator(() => value).generate("addition", 1)).toThrow(RangeError);
  });
  it.each([0, -1, 101, 2.5, NaN, Infinity])("rejects invalid batch count %s", count => {
    expect(() => new ProblemGenerator().generateBatch("addition", 1, count)).toThrow(RangeError);
  });
  it("generates 1 to 100 independent questions for the requested settings", () => {
    const generator = new ProblemGenerator(() => 0);
    expect(generator.generateBatch("addition", 1, 1)).toHaveLength(1);
    const batch = generator.generateBatch("division", 5, 100);
    expect(batch).toHaveLength(100);
    batch.forEach(problem => expect(problem).toMatchObject({ operation: "division", level: 5 }));
    expect(batch[0]).not.toBe(batch[1]);
  });
  it("validates batch settings even when the count is invalid", () => {
    expect(() => new ProblemGenerator().generateBatch("bad" as Operation, 1, 0)).toThrow(RangeError);
    expect(() => new ProblemGenerator().generateBatch("addition", 0 as DifficultyLevel, 0)).toThrow(RangeError);
  });
  it("protects shared configuration and returned problems from mutation", () => {
    expect(Reflect.set(getLevelConfig(1).additionSubtraction, "0", -10)).toBe(false);
    const problem = new ProblemGenerator().generate("addition", 1);
    expect(Object.isFrozen(problem)).toBe(true);
    expect(Object.isFrozen(problem.operands)).toBe(true);
  });
});

describe("checkAnswer", () => {
  const zero = new ProblemGenerator(() => 0).generate("addition", 1);
  const twenty = new ProblemGenerator(() => 0.9999).generate("addition", 1);
  it.each(["20", " 20 ", "020", 20])("accepts a correct whole-number answer %s", input => {
    expect(checkAnswer(twenty, input)).toBe(true);
  });
  it.each(["", " ", "0x0", "0abc", "0.0", "0e0", "Infinity", "-0", "1", NaN, Infinity, 0.1])("rejects invalid or wrong answer %s", input => {
    expect(checkAnswer(zero, input)).toBe(false);
  });
  it("accepts an explicit zero", () => {
    expect(checkAnswer(zero, "0")).toBe(true);
    expect(checkAnswer(zero, 0)).toBe(true);
  });
});


