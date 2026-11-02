import { describe, expect, it } from "vitest";
import type { ProblemDifficultyConfig } from "../levels/levelConfig.ts";
import { MainGameProblemGenerator } from "./MainGameProblemGenerator.ts";
import { ProblemDispatcher } from "./ProblemDispatcher.ts";

const mixedDigitConfig: ProblemDifficultyConfig = {
  mainGame: { 1: [2, 3] },
  miniGameOne: { 1: [1, 1] },
};

// Connects the real dispatcher and main-game generator; the unused minigame must never run.
function createDispatcher(random: () => number, config?: ProblemDifficultyConfig): ProblemDispatcher {
  const mainGame = new MainGameProblemGenerator(random);
  const unusedMiniGame = {
    generate() {
      throw new Error("A main-game request must not reach the minigame generator.");
    },
  };
  return new ProblemDispatcher(mainGame, unusedMiniGame, config);
}

describe("ProblemDispatcher and MainGameProblemGenerator integration", () => {
  it("returns the complete solution for 97 + 128 through the dispatcher", () => {
    const randomValues = [0.97, 0.032]; // Two digits -> 97; three digits -> 128.
    const dispatcher = createDispatcher(() => randomValues.shift()!, mixedDigitConfig);

    const result = dispatcher.generate({
      gameType: "main-game", operation: "addition", difficulty: 1,
    });

    expect(result).toEqual({
      operands: [97, 128],
      answer: 225,
      solution: {
        finalAnswer: 225,
        steps: [{
          operation: "addition",
          leftOperand: 97,
          rightOperand: 128,
          result: 225,
          additionColumns: [
            { placeValue: 1, leftDigit: 7, rightDigit: 8, carryIn: 0, total: 15, resultDigit: 5, carryOut: 1 },
            { placeValue: 10, leftDigit: 9, rightDigit: 2, carryIn: 1, total: 12, resultDigit: 2, carryOut: 1 },
            { placeValue: 100, leftDigit: 0, rightDigit: 1, carryIn: 1, total: 2, resultDigit: 2, carryOut: 0 },
          ],
        }],
      },
    });
  });

  it.each([
    ["subtraction", -31],
    ["multiplication", 12416],
    ["division", 0.7578125],
  ] as const)("preserves the requested %s operation and its solution", (operation, answer) => {
    const randomValues = [0.97, 0.032];
    const dispatcher = createDispatcher(() => randomValues.shift()!, mixedDigitConfig);

    expect(dispatcher.generate({ gameType: "main-game", operation, difficulty: 1 })).toEqual({
      operands: [97, 128],
      answer,
      solution: {
        finalAnswer: answer,
        steps: [{
          operation, leftOperand: 97, rightOperand: 128, result: answer,
          additionColumns: undefined,
        }],
      },
    });
  });

  it("uses the default level configuration to return both steps of 9 + 9 + 9", () => {
    const dispatcher = createDispatcher(() => 0.999999);

    expect(dispatcher.generate({
      gameType: "main-game", operation: "addition", difficulty: 4,
    })).toEqual({
      operands: [9, 9, 9],
      answer: 27,
      solution: {
        finalAnswer: 27,
        steps: [
          {
            operation: "addition", leftOperand: 9, rightOperand: 9, result: 18,
            additionColumns: [
              { placeValue: 1, leftDigit: 9, rightDigit: 9, carryIn: 0, total: 18, resultDigit: 8, carryOut: 1 },
              { placeValue: 10, leftDigit: 0, rightDigit: 0, carryIn: 1, total: 1, resultDigit: 1, carryOut: 0 },
            ],
          },
          {
            operation: "addition", leftOperand: 18, rightOperand: 9, result: 27,
            additionColumns: [
              { placeValue: 1, leftDigit: 8, rightDigit: 9, carryIn: 0, total: 17, resultDigit: 7, carryOut: 1 },
              { placeValue: 10, leftDigit: 1, rightDigit: 0, carryIn: 1, total: 2, resultDigit: 2, carryOut: 0 },
            ],
          },
        ],
      },
    });
  });

  it("uses each difficulty's own digit counts without changing the configuration", () => {
    const firstDigits = Object.freeze([2, 3]);
    const secondDigits = Object.freeze([3, 1, 2]);
    const config: ProblemDifficultyConfig = {
      mainGame: Object.freeze({ 1: firstDigits, 2: secondDigits }),
      miniGameOne: { 1: [1, 1] },
    };
    const dispatcher = createDispatcher(() => 0, config);

    const first = dispatcher.generate({ gameType: "main-game", operation: "addition", difficulty: 1 });
    const second = dispatcher.generate({ gameType: "main-game", operation: "addition", difficulty: 2 });

    expect(first).toMatchObject({ operands: [10, 100], answer: 110, solution: { finalAnswer: 110 } });
    expect(second).toMatchObject({ operands: [100, 1, 10], answer: 111, solution: { finalAnswer: 111 } });
    expect(config.mainGame).toEqual({ 1: [2, 3], 2: [3, 1, 2] });
  });

  it("returns a fresh problem and solution on each request", () => {
    const randomValues = [0.97, 0.032, 0, 0];
    const dispatcher = createDispatcher(() => randomValues.shift()!, mixedDigitConfig);
    const request = { gameType: "main-game", operation: "addition", difficulty: 1 } as const;

    const first = dispatcher.generate(request);
    const second = dispatcher.generate(request);

    expect(first).toMatchObject({
      operands: [97, 128], answer: 225,
      solution: { finalAnswer: 225, steps: [{ leftOperand: 97, rightOperand: 128, result: 225 }] },
    });
    expect(second).toMatchObject({
      operands: [10, 100], answer: 110,
      solution: { finalAnswer: 110, steps: [{ leftOperand: 10, rightOperand: 100, result: 110 }] },
    });
    // The shared dispatcher return type omits solution, so check its runtime shape directly.
    expect(first).toHaveProperty("solution.steps.length", 1);
    expect(second).toHaveProperty("solution.steps.length", 1);
    expect(second).not.toBe(first);
  });

  it("propagates generator validation errors for invalid configured digit counts", () => {
    const dispatcher = createDispatcher(() => 0, {
      mainGame: { 1: [2, 0] },
      miniGameOne: { 1: [1, 1] },
    });

    expect(() => dispatcher.generate({
      gameType: "main-game", operation: "addition", difficulty: 1,
    })).toThrow("Operand digit counts must be integers from 1 to 15.");
  });
});
