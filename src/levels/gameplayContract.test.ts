import { describe, expect, it } from "vitest";
import { AdventureMapScreenModel } from "../screens/AdventureMapScreen/AdventureMapScreenModel.ts";
import { launchCurrentLevel } from "./gameplayContract.ts";

describe("gameplay handoff", () => {
  it("passes the topic and level, then accepts one matching completion", () => {
    const model = new AdventureMapScreenModel();
    const launch = launchCurrentLevel(model);
    expect({ topicId: launch.topicId, levelId: launch.levelId, currentDifficulty: launch.currentDifficulty }).toEqual({
      topicId: "addition", levelId: "addition", currentDifficulty: 1,
    });
    expect(model.getMapData().progression.currentDifficulty).toBe(1);
    launch.onComplete();
    expect(model.getMapData().progression.currentDifficulty).toBe(2);
    expect(() => launch.onComplete()).toThrow();
    const nextLaunch = launchCurrentLevel(model);
    expect(nextLaunch.currentDifficulty).toBe(2);
    expect(() => launch.onComplete()).toThrow();
    nextLaunch.onComplete();
    expect(model.getMapData().progression.currentDifficulty).toBe(3);
  });
});
