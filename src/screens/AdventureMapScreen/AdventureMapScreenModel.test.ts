import { describe, expect, it } from "vitest";
import { ADDITION_LEVELS, MULTIPLICATION_LEVELS } from "../../levels/levelConfig.ts";
import { MainGameProblemGenerator } from "../../problem-engine/MainGameProblemGenerator.ts";
import { ProblemDispatcher } from "../../problem-engine/ProblemDispatcher.ts";
import { AdventureMapScreenModel } from "./AdventureMapScreenModel.ts";

describe("adventure map model", () => {
  it("exposes the static level definition and initial progression", () => {
    const model = new AdventureMapScreenModel();
    expect(model.getMapData().level).toBe(ADDITION_LEVELS);
    expect(model.getMapData().progression).toEqual({
      levelId: "addition", currentDifficulty: 1, isActive: false, isCompleted: false,
    });
  });

  it("supports another operation without changing the map model", () => {
    const model = new AdventureMapScreenModel(MULTIPLICATION_LEVELS);
    expect(model.getMapData().level).toBe(MULTIPLICATION_LEVELS);
    expect(model.getMapData().progression.levelId).toBe("multiplication");
  });

  it("exposes the shared operand digits for all five map difficulties", () => {
    const difficulties = new AdventureMapScreenModel().getMapData().difficulties;
    expect(difficulties).toEqual([
      { difficulty: 1, operandDigits: [1, 1] },
      { difficulty: 2, operandDigits: [1, 1] },
      { difficulty: 3, operandDigits: [1, 1] },
      { difficulty: 4, operandDigits: [1, 1, 1] },
      { difficulty: 5, operandDigits: [1, 1, 1] },
    ]);
  });

  it("keeps displayed stages aligned with generated main-game problems", () => {
    const map = new AdventureMapScreenModel(MULTIPLICATION_LEVELS);
    const dispatcher = new ProblemDispatcher(
      new MainGameProblemGenerator(() => 0),
      { generate: () => { throw new Error("Unexpected minigame request"); } },
    );

    for (const stage of map.getMapData().difficulties) {
      const problem = dispatcher.generate({
        gameType: "main-game",
        operation: map.getMapData().level.type,
        difficulty: map.startCurrentDifficulty(),
      });
      expect(problem.operands.map(operand => String(operand).length)).toEqual(stage.operandDigits);
      map.completeActiveDifficulty(stage.difficulty);
    }
    expect(map.getMapData().progression.isCompleted).toBe(true);
  });

  it("rejects invalid configuration and completion before a level starts", () => {
    expect(() => new AdventureMapScreenModel({ ...ADDITION_LEVELS, maxDifficulty: 0 })).toThrow();
    const model = new AdventureMapScreenModel();
    expect(() => model.completeActiveDifficulty(1)).toThrow();
    expect(model.getMapData().progression.currentDifficulty).toBe(1);
  });

  it("keeps earlier data snapshots unchanged when progress advances", () => {
    const model = new AdventureMapScreenModel();
    const beforeStart = model.getMapData();
    model.startCurrentDifficulty();
    expect(beforeStart.progression.isActive).toBe(false);
    expect(model.getMapData().progression.isActive).toBe(true);
    expect(model.getMapData().level).toBe(beforeStart.level);
  });

  it("starts and completes only the current difficulty", () => {
    const model = new AdventureMapScreenModel();
    expect(model.startCurrentDifficulty()).toBe(1);
    expect(model.getMapData().progression.isActive).toBe(true);
    model.completeActiveDifficulty(1);
    expect(model.getMapData().progression).toMatchObject({ currentDifficulty: 2, isActive: false });
    expect(() => model.completeActiveDifficulty(1)).toThrow();
    expect(model.startCurrentDifficulty()).toBe(2);
    expect(() => model.completeActiveDifficulty(1)).toThrow();
    expect(model.getMapData().progression.currentDifficulty).toBe(2);
  });

  it("marks the category complete after the fifth difficulty", () => {
    const model = new AdventureMapScreenModel();
    for (let levelNumber = 1; levelNumber <= 5; levelNumber++) {
      expect(model.startCurrentDifficulty()).toBe(levelNumber);
      model.completeActiveDifficulty(levelNumber);
    }
    expect(model.getMapData().progression).toMatchObject({
      currentDifficulty: 5, isActive: false, isCompleted: true,
    });
    expect(() => model.startCurrentDifficulty()).toThrow();
  });
});
