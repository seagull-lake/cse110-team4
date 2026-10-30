import { describe, expect, it, vi } from "vitest";
import { ProblemDispatcher } from "./ProblemDispatcher.ts";
import { MainGameProblemGenerator } from "./MainGameProblemGenerator.ts";
import type { ProblemDifficultyConfig } from "./problemDifficultyConfig.ts";

const config: ProblemDifficultyConfig = {
  mainGame: { 1: [1, 1], 2: [2, 1, 1] },
  miniGameOne: { 1: [1, 1], 2: [2, 1] },
};

function setup() {
  const mainGame = new MainGameProblemGenerator(() => 0);
  const miniGame = { generate: vi.fn(() => ({
    operands: [10, 1], answers: [{ value: 10, isCorrect: true }],
  })) };
  return { dispatcher: new ProblemDispatcher(mainGame, miniGame, config), miniGame };
}

describe("ProblemDispatcher", () => {
  it.each([
    ["addition", 12], ["subtraction", 8], ["multiplication", 10], ["division", 10],
  ] as const)("uses the main-game difficulty and requested %s operation", (operation, answer) => {
    const { dispatcher, miniGame } = setup();
    expect(dispatcher.generate({ gameType: "main-game", difficulty: 2, operation }))
      .toMatchObject({ operands: [10, 1, 1], answer });
    expect(miniGame.generate).not.toHaveBeenCalled();
  });

  it("forces multiplication with two configured operands for the minigame", () => {
    const { dispatcher, miniGame } = setup();
    const result = dispatcher.generate({ gameType: "mini-game-1", difficulty: 2, operation: "addition" });
    expect(miniGame.generate).toHaveBeenCalledExactlyOnceWith({
      operation: "multiplication", operandDigits: [2, 1],
    });
    expect(result).toBe(miniGame.generate.mock.results[0].value);
  });

  it("uses the starter configuration by default", () => {
    const dispatcher = new ProblemDispatcher(new MainGameProblemGenerator(() => 0), setup().miniGame);
    expect(dispatcher.generate({ gameType: "main-game", difficulty: 1, operation: "addition" }))
      .toMatchObject({ operands: [1, 1], answer: 2 });
  });

  it.each(["main-game", "mini-game-1"] as const)("rejects unconfigured %s difficulties", gameType => {
    expect(() => setup().dispatcher.generate({ gameType, difficulty: 3, operation: "addition" }))
      .toThrow("Unconfigured");
  });

  it.each([0, -1, 1.5, NaN, Infinity])("rejects invalid difficulty %s", difficulty => {
    expect(() => setup().dispatcher.generate({ gameType: "main-game", difficulty, operation: "addition" }))
      .toThrow("Difficulty must be a positive integer");
  });
});
