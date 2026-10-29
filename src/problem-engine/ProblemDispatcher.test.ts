import { describe, expect, it, vi } from "vitest";
import type { MainGameProblem, MiniGameOneProblem } from "../domain/problem.ts";
import { ProblemDispatcher } from "./ProblemDispatcher.ts";

const mainGameProblem: MainGameProblem = { operands: [12, 3], answer: 15 };
const miniGameOneProblem: MiniGameOneProblem = {
  operands: [12, 3],
  answers: [
    { value: 15, isCorrect: true },
    { value: 14, isCorrect: false },
    { value: 16, isCorrect: false },
    { value: 18, isCorrect: false },
  ],
};

function setup() {
  const mainGameGenerator = { generate: vi.fn(() => mainGameProblem) };
  const miniGameOneGenerator = { generate: vi.fn(() => miniGameOneProblem) };
  return {
    dispatcher: new ProblemDispatcher(mainGameGenerator, miniGameOneGenerator),
    mainGameGenerator,
    miniGameOneGenerator,
  };
}

describe("ProblemDispatcher", () => {
  it("routes a main-game request with digit counts derived for each operand", () => {
    const { dispatcher, mainGameGenerator, miniGameOneGenerator } = setup();

    expect(dispatcher.generate({
      gameType: "main-game", operation: "addition", difficulty: 4, operandCount: 3,
    }))
      .toBe(mainGameProblem);
    expect(mainGameGenerator.generate).toHaveBeenCalledExactlyOnceWith({
      operation: "addition", operandDigits: [3, 2, 3],
    });
    expect(miniGameOneGenerator.generate).not.toHaveBeenCalled();
  });

  it("routes mini-game 1 and supports every arithmetic operation", () => {
    const { dispatcher, mainGameGenerator, miniGameOneGenerator } = setup();

    for (const operation of ["addition", "subtraction", "multiplication", "division"] as const) {
      expect(dispatcher.generate({
        gameType: "mini-game-1", operation, difficulty: 5, operandCount: 2,
      }))
        .toBe(miniGameOneProblem);
    }
    expect(miniGameOneGenerator.generate).toHaveBeenCalledTimes(4);
    expect(miniGameOneGenerator.generate).toHaveBeenLastCalledWith({
      operation: "division", operandDigits: [3, 3],
    });
    expect(mainGameGenerator.generate).not.toHaveBeenCalled();
  });

  it("rejects invalid game types, operations, and difficulty values before routing", () => {
    const { dispatcher, mainGameGenerator, miniGameOneGenerator } = setup();

    expect(() => dispatcher.generate({
      gameType: "fraction-sort" as "main-game", operation: "addition", difficulty: 1, operandCount: 2,
    })).toThrow("Unsupported problem game type");
    expect(() => dispatcher.generate({
      gameType: "main-game", operation: "power" as "addition", difficulty: 1, operandCount: 2,
    })).toThrow("Unsupported operation");
    expect(() => dispatcher.generate({
      gameType: "main-game", operation: "addition", difficulty: 0, operandCount: 2,
    })).toThrow("Difficulty is outside the configured range");
    expect(() => dispatcher.generate({
      gameType: "main-game", operation: "addition", difficulty: 6, operandCount: 2,
    })).toThrow("Difficulty is outside the configured range");
    expect(() => dispatcher.generate({
      gameType: "main-game", operation: "addition", difficulty: 1, operandCount: 1,
    })).toThrow("At least two operands are required");
    expect(mainGameGenerator.generate).not.toHaveBeenCalled();
    expect(miniGameOneGenerator.generate).not.toHaveBeenCalled();
  });
});
