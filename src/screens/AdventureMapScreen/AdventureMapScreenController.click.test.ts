import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Screen } from "../../types.ts";
import { AdventureMapScreenController } from "./AdventureMapScreenController.ts";

// Konva can't draw text in tests, so the view is replaced with one that keeps its click handlers
const view = vi.hoisted(() => ({
  onLevelClick: (_difficulty: number) => {},
  onStartClick: () => {},
}));

vi.mock("./AdventureMapScreenView.ts", () => ({
  AdventureMapScreenView: class {
    constructor(_onHomeClick: () => void, onLevelClick: (difficulty: number) => void, onStartClick: () => void, _onBackClick: () => void) {
      view.onLevelClick = onLevelClick;
      view.onStartClick = onStartClick;
    }
    setTopic() {}
    show() {}
    hide() {}
  },
}));

const topics = ["addition", "subtraction", "multiplication", "division"] as const;
let saved: Record<string, string>;

beforeEach(() => {
  saved = {};
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => saved[key] ?? null,
    setItem: (key: string, value: string) => { saved[key] = value; },
  });
});

/** Opens a topic's map with saved progress, e.g. level 3 current = levels 1-2 completed. */
function openMap(topic: (typeof topics)[number], currentDifficulty = 1, isCompleted = false) {
  saved[`cse110-team4:progression:${topic}`] = JSON.stringify({ currentDifficulty, isCompleted });
  const screens: Screen[] = [];
  new AdventureMapScreenController({ switchToScreen: screen => screens.push(screen) }).setTopic(topic);
  return screens;
}

describe("clicking levels on the adventure map", () => {
  it.each(topics)("opens the current %s level", topic => {
    const screens = openMap(topic, 3);
    view.onLevelClick(3);
    expect(screens).toEqual([{ type: "mainproblem", topic, difficulty: 3 }]);
  });

  it("opens a completed level so it can be played again", () => {
    const screens = openMap("addition", 3);
    view.onLevelClick(1);
    expect(screens).toEqual([{ type: "mainproblem", topic: "addition", difficulty: 1 }]);
  });

  it("does nothing for locked levels", () => {
    const screens = openMap("division", 3);
    view.onLevelClick(4);
    view.onLevelClick(5);
    expect(screens).toEqual([]);
  });

  it("opens any level once the topic is finished", () => {
    const screens = openMap("subtraction", 5, true);
    view.onLevelClick(2);
    expect(screens).toEqual([{ type: "mainproblem", topic: "subtraction", difficulty: 2 }]);
  });

  it.each(topics)("Start opens the current %s level", topic => {
    const screens = openMap(topic, 2);
    view.onStartClick();
    expect(screens).toEqual([{ type: "mainproblem", topic, difficulty: 2 }]);
  });

  it("Start opens level 1 when nothing is saved", () => {
    const screens: Screen[] = [];
    new AdventureMapScreenController({ switchToScreen: screen => screens.push(screen) }).setTopic("multiplication");
    view.onStartClick();
    expect(screens).toEqual([{ type: "mainproblem", topic: "multiplication", difficulty: 1 }]);
  });
});
