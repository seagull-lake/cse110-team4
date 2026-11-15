import { describe, expect, it, vi } from "vitest";
import { ProblemDispatcher } from "./ProblemDispatcher.ts";
import { MainGameProblemGenerator } from "./MainGameProblemGenerator.ts";
import type { ProblemDifficultyConfig } from "../levels/levelConfig.ts";

const digits = { 1: [1, 1], 2: [2, 1, 1] };
const config: ProblemDifficultyConfig = {
  mainGame: { addition: digits, subtraction: digits, multiplication: digits, division: digits },
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

  it.each(["multiplication", "division"] as const)(
    "passes %s to the minigame with two configured operands", operation => {
      const { dispatcher, miniGame } = setup();
      const result = dispatcher.generate({ gameType: "mini-game-1", difficulty: 2, operation });
      expect(miniGame.generate).toHaveBeenCalledExactlyOnceWith({
        operation, operandDigits: [2, 1],
      });
      expect(result).toEqual({
        operands: [10, 1], answers: [{ value: 10, isCorrect: true }],
      });
    });

  it.each(["addition", "subtraction"] as const)("rejects %s for the minigame", operation => {
    const { dispatcher, miniGame } = setup();
    expect(() => dispatcher.generate({ gameType: "mini-game-1", difficulty: 1, operation }))
      .toThrow(`Mini-game-1 does not support ${operation}.`);
    expect(miniGame.generate).not.toHaveBeenCalled();
  });

  it.each([
    [1, [1, 1], 2], [2, [10, 10], 20], [3, [100, 100], 200],
    [4, [1000, 1000], 2000], [5, [10000, 10000], 20000],
  ])("addition difficulty %s uses its configured operands", (difficulty, operands, answer) => {
    const dispatcher = new ProblemDispatcher(new MainGameProblemGenerator(() => 0), setup().miniGame);
    expect(dispatcher.generate({ gameType: "main-game", difficulty, operation: "addition" }))
      .toMatchObject({ operands, answer });
  });

  it("looks up main-game digits by operation", () => {
    const dispatcher = new ProblemDispatcher(
      new MainGameProblemGenerator(() => 0), setup().miniGame,
      { mainGame: { ...config.mainGame, multiplication: { 1: [2, 2] } }, miniGameOne: { 1: [1, 1] } },
    );
    expect(dispatcher.generate({ gameType: "main-game", difficulty: 1, operation: "addition" }).operands)
      .toEqual([1, 1]);
    expect(dispatcher.generate({ gameType: "main-game", difficulty: 1, operation: "multiplication" }).operands)
      .toEqual([10, 10]);
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
