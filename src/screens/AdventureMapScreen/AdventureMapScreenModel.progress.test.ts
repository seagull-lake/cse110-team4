import { describe, expect, it } from "vitest";
import {
  ADDITION_LEVELS, getAllLevelDefinitions, problemDifficultyConfig,
} from "../../levels/levelConfig.ts";
import type { LevelDefinition } from "../../levels/levelConfig.ts";
import type { ProgressionState } from "../../levels/progression.ts";
import { AdventureMapScreenModel } from "./AdventureMapScreenModel.ts";

const state = (currentDifficulty: number, isCompleted = false, levelId = "addition"): ProgressionState =>
  ({ levelId, currentDifficulty, isActive: false, isCompleted });

describe("adventure map model with saved progress", () => {
  it("shows the saved progress instead of starting over", () => {
    const model = new AdventureMapScreenModel(ADDITION_LEVELS, state(3));
    expect(model.getMapData().progression).toEqual(state(3));
  });

  it("starts over only when no progress is given", () => {
    expect(new AdventureMapScreenModel(ADDITION_LEVELS).getMapData().progression.currentDifficulty).toBe(1);
  });

  it("continues from the saved level", () => {
    const model = new AdventureMapScreenModel(ADDITION_LEVELS, state(3));
    expect(model.startCurrentDifficulty()).toBe(3);
    model.completeActiveDifficulty(3);
    expect(model.getMapData().progression).toMatchObject({ currentDifficulty: 4, isActive: false });
    for (const levelNumber of [4, 5]) {
      expect(model.startCurrentDifficulty()).toBe(levelNumber);
      model.completeActiveDifficulty(levelNumber);
    }
    expect(model.getMapData().progression.isCompleted).toBe(true);
  });

  it("can't start another level once the topic was saved as completed", () => {
    const model = new AdventureMapScreenModel(ADDITION_LEVELS, state(5, true));
    expect(model.getMapData().progression.isCompleted).toBe(true);
    expect(() => model.startCurrentDifficulty()).toThrow();
  });

  it.each([
    ["another topic's progress", state(2, false, "subtraction")],
    ["difficulty 0", state(0)],
    ["a difficulty past the last", state(6)],
    ["a fractional difficulty", state(1.5)],
    ["completed before the last difficulty", state(2, true)],
  ])("rejects %s", (_name, progression) => {
    expect(() => new AdventureMapScreenModel(ADDITION_LEVELS, progression)).toThrow("Invalid progression state.");
  });
});

describe("adventure map model and the level config", () => {
  it.each(getAllLevelDefinitions().map(level => [level.type, level] as const))(
    "lists the five %s difficulties straight from the config", (_type, level) => {
      const { difficulties } = new AdventureMapScreenModel(level).getMapData();
      expect(difficulties.map(stage => stage.difficulty)).toEqual([1, 2, 3, 4, 5]);
      for (const stage of difficulties) {
        expect(stage.operandDigits).toBe(problemDifficultyConfig.mainGame[level.type][stage.difficulty]);
      }
    });

  it("follows a changed difficulty in the config", () => {
    const original = problemDifficultyConfig.mainGame.addition[2];
    try {
      problemDifficultyConfig.mainGame.addition[2] = [4, 4, 4];
      expect(new AdventureMapScreenModel().getMapData().difficulties[1].operandDigits).toEqual([4, 4, 4]);
    } finally {
      problemDifficultyConfig.mainGame.addition[2] = original;
    }
  });

  it("follows an added level in the config", () => {
    const longer: LevelDefinition = { ...ADDITION_LEVELS, maxDifficulty: 6 };
    try {
      problemDifficultyConfig.mainGame.addition[6] = [6, 6];
      const { difficulties } = new AdventureMapScreenModel(longer).getMapData();
      expect(difficulties).toHaveLength(6);
      expect(difficulties[5]).toEqual({ difficulty: 6, operandDigits: [6, 6] });
    } finally {
      delete problemDifficultyConfig.mainGame.addition[6];
    }
  });

  it("reports a level that has no digits configured instead of drawing a broken map", () => {
    const longer: LevelDefinition = { ...ADDITION_LEVELS, maxDifficulty: 6 };
    expect(() => new AdventureMapScreenModel(longer))
      .toThrow("No operand digits are configured for addition difficulty 6.");
  });
});
