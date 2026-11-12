import { describe, expect, it } from "vitest";
import type { LevelType } from "../../levels/levelConfig.ts";
import { MainProblemScreenModel } from "./MainProblemScreenModel.ts";

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
