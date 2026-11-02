import { describe, expect, it } from "vitest";
import type { MiniGameOneProblem, OperationType } from "../domain/problem.ts";
import { MainGameProblemGenerator } from "./MainGameProblemGenerator.ts";
import { ProblemDispatcher } from "./ProblemDispatcher.ts";
import {
  CHOICE_COUNT, MAX_NUMBER, MAX_WRONG_DISTANCE, MIN_NUMBER, MultiplicationDivisionGenerator,
} from "./MultiplicationDivisionGenerator.ts";

/** Returns the given values in order, then 0, so a test controls every random pick. */
function sequence(...values: number[]): () => number {
  return () => values.shift() ?? 0;
}

/** Small seeded random source (mulberry32): many varied problems, same ones every run. */
function seeded(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generate(operation: OperationType, random: () => number): MiniGameOneProblem {
  return new MultiplicationDivisionGenerator(random).generate({ operation, operandDigits: [1, 1] });
}

function correctValue(problem: MiniGameOneProblem): number {
  return problem.answers.find(answer => answer.isCorrect)!.value;
}

/** The rules every question must follow, whatever numbers were picked. */
function expectValidChoices(problem: MiniGameOneProblem): void {
  const values = problem.answers.map(answer => answer.value);
  expect(values).toHaveLength(CHOICE_COUNT);
  expect(new Set(values).size).toBe(CHOICE_COUNT);
  expect(problem.answers.filter(answer => answer.isCorrect)).toHaveLength(1);
  for (const value of values) {
    expect(Number.isInteger(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(0);
    expect(Math.abs(value - correctValue(problem))).toBeLessThanOrEqual(MAX_WRONG_DISTANCE);
  }
}

describe("MultiplicationDivisionGenerator", () => {
  describe("multiplication", () => {
    it("marks the product as the correct choice", () => {
      // 0.5 * 13 → 6 and 0.55 * 13 → 7
      const problem = generate("multiplication", sequence(0.5, 0.55));
      expect(problem.operands).toEqual([6, 7]);
      expect(correctValue(problem)).toBe(42);
      expectValidChoices(problem);
    });

    it("handles the smallest question, 0 × 0, with only positive wrong options", () => {
      const problem = generate("multiplication", () => 0);
      expect(problem.operands).toEqual([0, 0]);
      expect(correctValue(problem)).toBe(0);
      expectValidChoices(problem);
    });

    it("handles the largest question, 12 × 12", () => {
      const problem = generate("multiplication", () => 0.999999);
      expect(problem.operands).toEqual([12, 12]);
      expect(correctValue(problem)).toBe(144);
      expectValidChoices(problem);
    });
  });

  describe("division", () => {
    it("builds the dividend from the answer so it divides evenly", () => {
      // divisor: 1 + 0.5 * 12 → 7, answer: 0.5 * 13 → 6
      const problem = generate("division", sequence(0.5, 0.5));
      expect(problem.operands).toEqual([42, 7]);
      expect(correctValue(problem)).toBe(6);
      expectValidChoices(problem);
    });

    it("never divides by 0, even at the lowest random value", () => {
      const problem = generate("division", () => 0);
      expect(problem.operands).toEqual([0, 1]);
      expect(correctValue(problem)).toBe(0);
      expectValidChoices(problem);
    });

    it("handles the largest question, 144 ÷ 12", () => {
      const problem = generate("division", () => 0.999999);
      expect(problem.operands).toEqual([144, 12]);
      expect(correctValue(problem)).toBe(12);
      expectValidChoices(problem);
    });
  });

  describe.each(["multiplication", "division"] as const)("%s over many questions", operation => {
    const random = seeded(110);
    const problems = Array.from({ length: 500 }, () => generate(operation, random));

    it("keeps numbers in the 0–12 range and follows the choice rules", () => {
      for (const problem of problems) {
        const [left, right] = problem.operands;
        if (operation === "multiplication") {
          expect([left, right].every(n => n >= MIN_NUMBER && n <= MAX_NUMBER)).toBe(true);
          expect(correctValue(problem)).toBe(left * right);
        } else {
          expect(right).toBeGreaterThanOrEqual(1);
          expect(right).toBeLessThanOrEqual(MAX_NUMBER);
          expect(correctValue(problem)).toBe(left / right);
          expect(correctValue(problem)).toBeLessThanOrEqual(MAX_NUMBER);
        }
        expectValidChoices(problem);
      }
    });

    it("puts the correct answer in every position over time", () => {
      const positions = new Set(problems.map(problem => problem.answers.findIndex(a => a.isCorrect)));
      expect(positions).toEqual(new Set([0, 1, 2, 3]));
    });
  });

  it.each(["multiplication", "division"] as const)("gives the same %s question for the same random source", operation => {
    expect(generate(operation, seeded(7))).toEqual(generate(operation, seeded(7)));
  });

  it("uses the 0–12 range even when larger digit counts are requested", () => {
    const generator = new MultiplicationDivisionGenerator(() => 0.999999);
    const problem = generator.generate({ operation: "multiplication", operandDigits: [3, 3] });
    expect(problem.operands).toEqual([12, 12]);
  });

  it.each(["addition", "subtraction"] as const)("rejects %s", operation => {
    expect(() => generate(operation, () => 0)).toThrow(`Mini Game #1 does not support ${operation}.`);
  });

  it("answers Mini Game #1 requests through the ProblemDispatcher", () => {
    const dispatcher = new ProblemDispatcher(
      new MainGameProblemGenerator(),
      new MultiplicationDivisionGenerator(sequence(0.5, 0.55)),
    );
    const problem = dispatcher.generate({ gameType: "mini-game-1", difficulty: 1, operation: "multiplication" });
    expect(problem.operands).toEqual([6, 7]);
    expect("answers" in problem && correctValue(problem)).toBe(42);
  });
});
