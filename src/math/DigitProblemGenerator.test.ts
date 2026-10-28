import { describe, expect, it, vi } from "vitest";
import { generateProblem, generateAnswer, generateNumberWithDigits, dispatchProblem, validateAnswer } from "./ProblemGenerator.ts";
import { compareFractions } from "./FractionGenerator.ts";
import type { GeneratedProblem, Operation } from "../interfaces/ProblemGeneration.ts";
import type { GameGenerationRequest } from "../interfaces/GameInterfaces.ts";

function randomSource(): () => number {
  let seed = 42;
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

describe("Digit-based arithmetic component", () => {
  for (const operation of ["addition", "subtraction", "multiplication", "division"] as const) {
    it(`preserves exact operand lengths and integer answers for ${operation}`, () => {
      const random = randomSource();
      for (let leftDigits = 1; leftDigits <= 15; leftDigits++) {
        for (let rightDigits = 1; rightDigits <= 15; rightDigits++) {
          const impossibleOrder = (operation === "subtraction" || operation === "division") && leftDigits < rightDigits;
          const overflow = operation === "multiplication" &&
            BigInt(10 ** leftDigits - 1) * BigInt(10 ** rightDigits - 1) > BigInt(Number.MAX_SAFE_INTEGER);
          if (impossibleOrder || overflow) {
            expect(() => generateProblem(leftDigits, rightDigits, operation, random)).toThrow(RangeError);
            continue;
          }
          for (const source of [() => 0, () => 1 - Number.EPSILON, random]) {
            const problem: GeneratedProblem = generateProblem(leftDigits, rightDigits, operation, source);
            const [left, right] = problem.operands;
            expect(String(left)).toHaveLength(leftDigits);
            expect(String(right)).toHaveLength(rightDigits);
            expect(Number.isSafeInteger(problem.answer)).toBe(true);
            expect(problem.answer).toBeGreaterThanOrEqual(0);
            expect(problem.operation).toBe(operation);
            expect(problem).not.toHaveProperty("level");
            const a = BigInt(left), b = BigInt(right);
            const expected = operation === "addition" ? a + b : operation === "subtraction" ? a - b :
              operation === "multiplication" ? a * b : a / b;
            expect(BigInt(problem.answer)).toBe(expected);
            if (operation === "division") expect(a % b).toBe(0n);
          }
        }
      }
    });
  }
  it("returns operands and an integer answer, with an optional integer-only entry point", () => {
    expect(generateProblem(2, 3, "addition", () => 0)).toEqual({
      operation: "addition", operands: [10, 100], expression: "10 + 100", answer: 110,
    });
    expect(generateAnswer(2, 3, "addition", () => 0)).toBe(110);
  });
  it("swaps only equal-length subtraction operands", () => {
    const random = vi.fn().mockReturnValueOnce(0).mockReturnValueOnce(0.9999);
    expect(generateProblem(2, 2, "subtraction", random)).toMatchObject({ operands: [99, 10], answer: 89 });
    expect(() => generateProblem(1, 2, "subtraction")).toThrow(RangeError);
  });
  it("rejects invalid options before consuming randomness", () => {
    const random = vi.fn(() => 0);
    for (const value of [0, -1, 16, 1.5, NaN, Infinity, "2", null, undefined]) {
      expect(() => generateProblem(value as number, 2, "addition", random)).toThrow(RangeError);
      expect(() => generateProblem(2, value as number, "addition", random)).toThrow(RangeError);
    }
    expect(() => generateProblem(2, 2, "power" as Operation, random)).toThrow(RangeError);
    expect(() => generateProblem(8, 8, "multiplication", random)).toThrow(RangeError);
    expect(() => generateProblem(1, 2, "division", random)).toThrow(RangeError);
    expect(random).not.toHaveBeenCalled();
  });
  it.each([-1, 1, NaN, Infinity, undefined, "0.5"])("rejects invalid random value %s", value => {
    expect(() => generateProblem(2, 2, "addition", () => value as number)).toThrow(RangeError);
  });
  it("uses Math.random by default and returns independent results", () => {
    const random = vi.spyOn(Math, "random").mockReturnValue(0.5);
    try {
      const first = generateProblem(2, 3, "addition");
      expect(first).toMatchObject({ operands: [55, 550], answer: 605 });
      const second = generateProblem(2, 3, "addition");
      first.operands[0] = 99;
      expect(second.operands).toEqual([55, 550]);
    } finally { random.mockRestore(); }
  });
  it("generates one positive number when only a single operand is needed", () => {
    for (let digits = 1; digits <= 15; digits++) {
      expect(generateNumberWithDigits(digits, () => 0)).toBe(10 ** (digits - 1));
      expect(generateNumberWithDigits(digits, () => 1 - Number.EPSILON)).toBe(10 ** digits - 1);
    }
  });
});

describe("Simple digit-based dispatcher and shared minigame contracts", () => {
  it("forwards a main-game request without any level configuration", () => {
    const request: GameGenerationRequest = { game: "main", leftDigits: 2, rightDigits: 3, operation: "addition" };
    const problem = dispatchProblem(request, () => 0);
    expect(problem).toMatchObject({ game: "main", operands: [10, 100], solution: 110 });
    expect(problem).not.toHaveProperty("level");
    expect(validateAnswer(problem, "110").correct).toBe(true);
  });
  it("adapts generated numbers into four distinct choices for minigame #1", () => {
    const problem = dispatchProblem({ game: "multiplication-division", leftDigits: 3, rightDigits: 1, operation: "division" }, () => 0);
    if (problem.game !== "multiplication-division") throw new Error("Wrong game");
    expect(problem.operands).toEqual([100, 1]);
    expect(problem.choices).toHaveLength(4);
    expect(new Set(problem.choices).size).toBe(4);
    expect(problem.choices.filter(value => value === problem.answer)).toHaveLength(1);
    expect(validateAnswer(problem, problem.answer).correct).toBe(true);
  });
  it("supports large but safe multiplication answers and choices", () => {
    const problem = dispatchProblem({ game: "multiplication-division", leftDigits: 15, rightDigits: 1, operation: "multiplication" }, () => 1 - Number.EPSILON);
    if (problem.game !== "multiplication-division") throw new Error("Wrong game");
    expect(problem.choices.every(Number.isSafeInteger)).toBe(true);
  });
  it("provides a fraction interface without modifying FractionSort", () => {
    const problem = dispatchProblem({ game: "fraction", leftDigits: 2, rightDigits: 3 }, () => 0);
    if (problem.game !== "fraction") throw new Error("Wrong game");
    expect(problem.reference).toMatchObject({ numerator: 10, denominator: 100 });
    expect(problem.comparisons).toHaveLength(3);
    expect(validateAnswer(problem, problem.solution).correct).toBe(true);
  });
  it("preserves digit counts for proper fractions at random boundaries", () => {
    for (const [leftDigits, rightDigits] of [[1, 1], [1, 3], [3, 3], [14, 15], [15, 15]]) {
      for (const random of [() => 0, () => 1 - Number.EPSILON, randomSource()]) {
        const problem = dispatchProblem({ game: "fraction", leftDigits, rightDigits }, random);
        if (problem.game !== "fraction") throw new Error("Wrong game");
        for (const f of [problem.reference, ...problem.comparisons]) {
          expect(String(f.numerator)).toHaveLength(leftDigits);
          expect(String(f.denominator)).toHaveLength(rightDigits);
          expect(f.numerator).toBeLessThan(f.denominator);
        }
      }
    }
  });
  it("compares large fractions exactly even when floating-point values are equal", () => {
    const first = { numerator: 999999999999998, denominator: 999999999999999, value: 1 };
    const second = { numerator: 999999999999997, denominator: 999999999999998, value: 1 };
    expect(compareFractions(first, second)).toBe("lesser");
  });
  it.each([
    null, {}, { game: "unknown" },
    { game: "multiplication-division", leftDigits: 2, rightDigits: 2, operation: "addition" },
    { game: "fraction", leftDigits: 3, rightDigits: 2 },
    { game: "fraction", leftDigits: 1, rightDigits: 1, comparisonCount: 0 },
  ])("rejects invalid dispatcher requests %#", request => {
    expect(() => dispatchProblem(request as GameGenerationRequest)).toThrow(RangeError);
  });
});
