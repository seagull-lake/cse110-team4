import { describe, expect, it, vi } from "vitest";
import { problemDifficultyConfig } from "../../levels/levelConfig.ts";
import type { LevelType } from "../../levels/levelConfig.ts";
import { MainProblemScreenModel, createProblemDispatcher } from "./MainProblemScreenModel.ts";

const topics = ["addition", "subtraction", "multiplication", "division"] as const;
const levels = topics.flatMap(topic => [1, 2, 3, 4, 5].map(difficulty => [topic, difficulty] as const));

describe("main problem screen model", () => {
  it("keeps the topic and difficulty of the opened level", () => {
    const model = new MainProblemScreenModel("multiplication", 4);
    expect(model.getTopic()).toBe("multiplication");
    expect(model.getDifficulty()).toBe(4);
    expect(model.getTitle()).toBe("Multiplication – Level 4");
  });

  it.each([1, 5])("accepts level %s", difficulty => {
    expect(new MainProblemScreenModel("addition", difficulty).getDifficulty()).toBe(difficulty);
  });

  it.each([0, 6, 2.5])("rejects level %s", difficulty => {
    expect(() => new MainProblemScreenModel("addition", difficulty)).toThrow("has no difficulty");
  });

  it("rejects an unknown topic", () => {
    expect(() => new MainProblemScreenModel("fractions" as LevelType, 1)).toThrow("Unknown level type");
  });
});

describe("the problem a level asks for", () => {
  it.each(levels)("%s level %s asks the dispatcher for a main-game problem of that level", (topic, difficulty) => {
    const dispatcher = createProblemDispatcher();
    const generate = vi.spyOn(dispatcher, "generate");
    new MainProblemScreenModel(topic, difficulty, dispatcher);
    expect(generate).toHaveBeenCalledExactlyOnceWith({ gameType: "main-game", operation: topic, difficulty });
  });

  it.each(levels)("%s level %s gets numbers with the configured digit counts", (topic, difficulty) => {
    const { operands } = new MainProblemScreenModel(topic, difficulty).getProblem();
    expect(operands.map(operand => String(operand).length))
      .toEqual(problemDifficultyConfig.mainGame[topic][difficulty]);
  });

  it("keeps the problem the dispatcher returned", () => {
    const problem = { operands: [482, 315], answer: 797 };
    const model = new MainProblemScreenModel("addition", 3, { generate: () => problem } as never);
    expect(model.getProblem()).toBe(problem);
  });

  it("only accepts a complete correct answer and only then allows continuing", () => {
    const model = new MainProblemScreenModel(
      "addition", 1, { generate: () => ({ operands: [482, 315], answer: 797 }) } as never,
    );

    expect(model.checkAnswer(["7", "9", "8"])).toBe(false);
    expect(model.canContinue()).toBe(false);
    expect(model.checkAnswer(["7", "9", "7"])).toBe(true);
    expect(model.canContinue()).toBe(true);
  });
});
