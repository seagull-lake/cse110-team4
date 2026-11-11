import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Screen } from "../../types.ts";
import { getLevelDefinition, problemDifficultyConfig } from "../../levels/levelConfig.ts";
import { saveProgression } from "../../storage.ts";
import type { AdventureMapData } from "./AdventureMapScreenModel.ts";
import { AdventureMapScreenController } from "./AdventureMapScreenController.ts";

// Konva can't draw text in tests, so the view is replaced with one that records what it was told
const view = vi.hoisted(() => ({
  topic: "",
  data: null as AdventureMapData | null,
  calls: 0,
}));

vi.mock("./AdventureMapScreenView.ts", () => ({
  AdventureMapScreenView: class {
    setTopic(topic: string, data: AdventureMapData) { view.topic = topic; view.data = data; view.calls++; }
    show() {}
    hide() {}
  },
}));

const topics = ["addition", "subtraction", "multiplication", "division"] as const;

function setup() {
  const screens: Screen[] = [];
  return { controller: new AdventureMapScreenController({ switchToScreen: screen => screens.push(screen) }), screens };
}

let saved: Record<string, string>;

beforeEach(() => {
  saved = {};
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => saved[key] ?? null,
    setItem: (key: string, value: string) => { saved[key] = value; },
  });
  view.topic = "";
  view.data = null;
  view.calls = 0;
});

describe("adventure map controller and saved progress", () => {
  it.each(topics)("gives the view all five %s levels from the config", topic => {
    setup().controller.setTopic(topic);
    expect(view.topic).toBe(topic);
    expect(view.data?.level).toBe(getLevelDefinition(topic));
    expect(view.data?.difficulties).toEqual([1, 2, 3, 4, 5].map(difficulty => ({
      difficulty, operandDigits: problemDifficultyConfig.mainGame[topic][difficulty],
    })));
  });

  it("starts a topic with nothing saved at level 1", () => {
    setup().controller.setTopic("addition");
    expect(view.data?.progression).toEqual({
      levelId: "addition", currentDifficulty: 1, isActive: false, isCompleted: false,
    });
  });

  it("shows each topic's own saved progress", () => {
    const addition = getLevelDefinition("addition");
    const division = getLevelDefinition("division");
    saveProgression(addition, { levelId: "addition", currentDifficulty: 3, isActive: false, isCompleted: false });
    saveProgression(division, { levelId: "division", currentDifficulty: 5, isActive: false, isCompleted: true });
    const { controller } = setup();

    controller.setTopic("addition");
    expect(view.data?.progression).toMatchObject({ currentDifficulty: 3, isCompleted: false });
    controller.setTopic("division");
    expect(view.data?.progression).toMatchObject({ currentDifficulty: 5, isCompleted: true });
    controller.setTopic("subtraction");
    expect(view.data?.progression).toMatchObject({ currentDifficulty: 1, isCompleted: false });
  });

  it("picks up progress saved after the map was last shown", () => {
    const { controller } = setup();
    controller.setTopic("addition");
    expect(view.data?.progression.currentDifficulty).toBe(1);

    saveProgression(getLevelDefinition("addition"),
      { levelId: "addition", currentDifficulty: 2, isActive: false, isCompleted: false });
    controller.setTopic("addition");
    expect(view.data?.progression.currentDifficulty).toBe(2);
  });

  it("starts over when the saved progress is corrupted", () => {
    saved["cse110-team4:progression:addition"] = "{\"currentDifficulty\":99,\"isCompleted\":false}";
    setup().controller.setTopic("addition");
    expect(view.data?.progression.currentDifficulty).toBe(1);
  });

  it("keeps the topic in sync with the map", () => {
    const { controller } = setup();
    for (const topic of topics) {
      controller.setTopic(topic);
      expect(controller.getTopic()).toBe(topic);
    }
    expect(view.calls).toBe(topics.length);
  });
});
