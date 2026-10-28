import { describe, expect, it, vi } from "vitest";
import { generateGameProblem, getLevelConfig, validateAnswer, checkFractionRelation } from "./ProblemGenerator.ts";
import type { GameRequest, Fraction, FractionProblem } from "./ProblemGenerator.ts";
import { compareFractions, generateFraction } from "./FractionGenerator.ts";

function randomSource(): () => number {
  let seed = 123456789;
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}
function fraction(numerator: number, denominator: number): Fraction {
  return { numerator, denominator, value: numerator / denominator };
}
function comparisonProblem(): FractionProblem {
  return {
    game: "fraction", kind: "fraction-comparison", level: 1,
    reference: fraction(1, 2), comparisons: [fraction(1, 3), fraction(3, 4), fraction(2, 4)],
    expression: "Compare with 1/2", prompt: "Compare with 1/2",
    solution: ["lesser", "greater", "equal to"],
  };
}

describe("Game Interpreter", () => {
  for (const level of [1, 2, 3, 4, 5] as const) {
    it(`routes main-game fill-in-the-blank questions at level ${level}`, () => {
      for (const operation of ["addition", "subtraction", "multiplication", "division"] as const) {
        const problem = generateGameProblem({ game: "main", operation, level }, randomSource());
        expect(problem.game).toBe("main");
        if (problem.game !== "main") throw new Error("Wrong game");
        expect(problem.kind).toBe("fill-in-the-blank");
        expect(problem.prompt).toBe(problem.expression + " = ___");
        expect(problem.solution).toBe(problem.answer);
        expect(problem.hint.length).toBeGreaterThan(10);
        expect(problem.explanation).toContain(String(problem.answer));
        const result = validateAnswer(problem, String(problem.solution));
        expect(result.correct).toBe(true);
        expect(result.hint).toBe(problem.hint);
        expect(result.explanation).toBe(problem.explanation);
        expect(validateAnswer(problem, problem.solution + 1)).toMatchObject({ valid: true, correct: false });
      }
    });

    it(`generates four unique choices with exactly one correct answer at level ${level}`, () => {
      const random = randomSource();
      const correctPositions = new Set<number>();
      for (const operation of ["multiplication", "division"] as const) {
        for (let i = 0; i < 200; i++) {
          const problem = generateGameProblem({ game: "multiplication-division", operation, level }, random);
          if (problem.game !== "multiplication-division") throw new Error("Wrong game");
          expect(problem.kind).toBe("multiple-choice");
          expect(problem.choices).toHaveLength(4);
          expect(new Set(problem.choices).size).toBe(4);
          expect(problem.choices.filter(value => value === problem.solution)).toHaveLength(1);
          expect(problem.choices.every(value => Number.isSafeInteger(value) && value >= 0)).toBe(true);
          correctPositions.add(problem.choices.indexOf(problem.solution));
          for (const choice of problem.choices) {
            expect(validateAnswer(problem, choice)).toMatchObject({ valid: true, correct: choice === problem.solution });
          }
          expect(validateAnswer(problem, -1)).toMatchObject({ valid: false, correct: false });
          if (operation === "division") {
            expect(problem.operands[1]).toBeGreaterThan(0);
            expect(problem.operands[0] % problem.operands[1]).toBe(0);
          }
        }
      }
      expect(correctPositions.size).toBe(4);
    });

    it(`generates proper fractions and exact relations at level ${level}`, () => {
      const random = randomSource();
      for (let i = 0; i < 200; i++) {
        const problem = generateGameProblem({ game: "fraction", level }, random);
        if (problem.game !== "fraction") throw new Error("Wrong game");
        expect(problem.comparisons).toHaveLength(3);
        for (const f of [problem.reference, ...problem.comparisons]) {
          expect(f.numerator).toBeGreaterThanOrEqual(1);
          expect(f.numerator).toBeLessThan(f.denominator);
          expect(f.denominator).toBeLessThanOrEqual([5, 8, 12, 16, 20][level - 1]);
        }
        expect(problem.solution).toEqual(problem.comparisons.map(f => compareFractions(problem.reference, f)));
        expect(validateAnswer(problem, problem.solution)).toMatchObject({ valid: true, correct: true, results: [true, true, true] });
      }
    });
  }

  it.each([() => 0, () => 1 - Number.EPSILON])("terminates at random endpoints, even with zero answers", random => {
    for (const operation of ["multiplication", "division"] as const) {
      const problem = generateGameProblem({ game: "multiplication-division", operation, level: 1 }, random);
      if (problem.game !== "multiplication-division") throw new Error("Wrong game");
      expect(new Set(problem.choices).size).toBe(4);
      expect(problem.choices).toContain(problem.answer);
    }
  });

  it.each([null, undefined, {}, { game: "unknown", level: 1 }, { game: "main", operation: "power", level: 1 },
    { game: "multiplication-division", operation: "addition", level: 1 },
    { game: "main", operation: "addition", level: 0 }, { game: "fraction", level: 6 },
    { game: "fraction", level: 1, comparisonCount: 0 }, { game: "fraction", level: 1, comparisonCount: 11 },
    { game: "fraction", level: 1, comparisonCount: null },
  ])("rejects invalid game requests %#", request => {
    expect(() => generateGameProblem(request as GameRequest)).toThrow(RangeError);
  });

  it("supports caller-owned difficulty without mutating the configuration", () => {
    const config = getLevelConfig(2);
    config.additionSubtraction = [20, 20];
    config.multiplication = [[3, 3], [4, 4]];
    config.division = { dividend: [24, 24], divisor: [5, 6] };
    config.fractionMaxDenominator = 3;
    const before = structuredClone(config);
    const main = generateGameProblem({ game: "main", operation: "addition", level: 2, configuration: config }, () => 0);
    expect(main.solution).toBe(40);
    const multi = generateGameProblem({ game: "multiplication-division", operation: "multiplication", level: 2, configuration: config }, () => 0);
    expect(multi.solution).toBe(12);
    const division = generateGameProblem({ game: "main", operation: "division", level: 2, configuration: config }, () => 0);
    expect(division).toMatchObject({ operands: [24, 6], answer: 4 });
    const fractions = generateGameProblem({ game: "fraction", level: 2, configuration: config }, () => 0.9999);
    if (fractions.game !== "fraction") throw new Error("Wrong game");
    expect(fractions.reference.denominator).toBe(3);
    expect(config).toEqual(before);
  });

  it("rejects impossible division and invalid external configurations", () => {
    const config = getLevelConfig(1);
    config.division = { dividend: [10, 10], divisor: [6, 6] };
    expect(() => generateGameProblem({ game: "main", operation: "division", level: 1, configuration: config })).toThrow(RangeError);
    config.division = { dividend: [0, 10], divisor: [0, 0] };
    expect(() => generateGameProblem({ game: "main", operation: "division", level: 1, configuration: config })).toThrow(RangeError);
    const invalids = [
      { ...getLevelConfig(1), level: 2 }, { ...getLevelConfig(1), additionSubtraction: [99, 1] },
      { ...getLevelConfig(1), additionSubtraction: Array(2) }, { ...getLevelConfig(1), multiplication: [] },
      { ...getLevelConfig(1), fractionMaxDenominator: 1 },
    ];
    for (const invalid of invalids) {
      const request = { game: "main", operation: "addition", level: 1, configuration: invalid };
      expect(() => generateGameProblem(request as GameRequest)).toThrow(RangeError);
    }
  });

  it("uses reproducible randomness and rejects invalid random values", () => {
    const request: GameRequest = { game: "multiplication-division", operation: "multiplication", level: 3 };
    expect(generateGameProblem(request, randomSource())).toEqual(generateGameProblem(request, randomSource()));
    for (const game of ["main", "multiplication-division", "fraction"]) {
      const request = { game, level: 1, operation: "multiplication" } as GameRequest;
      expect(() => generateGameProblem(request, () => 1)).toThrow(RangeError);
    }
  });

  it("keeps returned solutions independent and does not write progress or scores", () => {
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", { setItem });
    try {
      const first = generateGameProblem({ game: "fraction", level: 1 }, () => 0);
      const second = generateGameProblem({ game: "fraction", level: 1 }, () => 0);
      if (first.game !== "fraction" || second.game !== "fraction") throw new Error("Wrong game");
      first.comparisons[0].numerator = 99;
      expect(second.comparisons[0].numerator).toBe(1);
      const result = validateAnswer(second, second.solution);
      (result.solution as string[])[0] = "changed";
      expect(second.solution[0]).toBe("equal to");
      expect(setItem).not.toHaveBeenCalled();
    } finally { vi.unstubAllGlobals(); }
  });
});

describe("Shared Validator", () => {
  it.each(["", " ", "1.0", "1e1", "0x0", "-1", "9007199254740992", NaN, Infinity, null, undefined, true])(
    "rejects malformed numeric answers %s", input => {
      const problem = generateGameProblem({ game: "main", operation: "addition", level: 1 }, () => 0);
      expect(validateAnswer(problem, input)).toMatchObject({ valid: false, correct: false });
    },
  );
  it("accepts numeric strings, whitespace, and zero", () => {
    const problem = generateGameProblem({ game: "main", operation: "addition", level: 1 }, () => 0);
    expect(validateAnswer(problem, " 00 ")).toMatchObject({ valid: true, correct: true });
    expect(validateAnswer(problem, 0)).toMatchObject({ valid: true, correct: true });
  });
  it("validates lesser, greater, and equivalent fractions by cross-multiplication", () => {
    const problem = comparisonProblem();
    expect(validateAnswer(problem, ["lesser", "greater", "equal to"])).toMatchObject({ valid: true, correct: true });
    expect(validateAnswer(problem, ["greater", "greater", "lesser"])).toMatchObject({ valid: true, correct: false, results: [false, true, false] });
    expect(checkFractionRelation({ ...fraction(1, 2), value: 0 }, { ...fraction(2, 4), value: 1 }, "equal to")).toBe(true);
  });
  it.each([[], ["lesser"], ["lesser", "greater", ""], Array(3), "lesser", null])(
    "rejects missing or malformed fraction placements %#", input => {
      expect(validateAnswer(comparisonProblem(), input)).toMatchObject({ valid: false, correct: false });
    },
  );
  it("supports comparison counts and validates denominator bounds", () => {
    const problem = generateGameProblem({ game: "fraction", level: 1, comparisonCount: 10 }, () => 0);
    if (problem.game !== "fraction") throw new Error("Wrong game");
    expect(problem.comparisons).toHaveLength(10);
    expect(validateAnswer(problem, problem.solution).correct).toBe(true);
    for (const max of [0, 1, 1001, 1.5, NaN]) expect(() => generateFraction(Math.random, max)).toThrow(RangeError);
    expect(() => compareFractions(fraction(1, 0), fraction(1, 2))).toThrow(RangeError);
  });
});
