import { describe, expect, it, vi } from "vitest";
import type { Screen } from "../../types.ts";
import { MainProblemScreenController } from "./MainProblemScreenController.ts";

// Konva can't draw text in tests, so the view is replaced with one that records what it was told
const view = vi.hoisted(() => ({
  onHomeClick: () => {},
  onBackClick: () => {},
  title: "",
  visible: false,
}));

vi.mock("./MainProblemScreenView.ts", () => ({
  MainProblemScreenView: class {
    constructor(onHomeClick: () => void, onBackClick: () => void) {
      view.onHomeClick = onHomeClick;
      view.onBackClick = onBackClick;
    }
    setTitle(title: string) { view.title = title; }
    show() { view.visible = true; }
    hide() { view.visible = false; }
  },
}));

function setup() {
  const screens: Screen[] = [];
  const controller = new MainProblemScreenController({ switchToScreen: screen => screens.push(screen) });
  return { controller, screens };
}

describe("main problem screen controller", () => {
  it.each([
    ["addition", 1, "Addition – Level 1"],
    ["subtraction", 2, "Subtraction – Level 2"],
    ["multiplication", 4, "Multiplication – Level 4"],
    ["division", 5, "Division – Level 5"],
  ] as const)("shows the %s level %s title", (topic, difficulty, title) => {
    setup().controller.setLevel(topic, difficulty);
    expect(view.title).toBe(title);
  });

  it("goes back to the menu on Home", () => {
    const { controller, screens } = setup();
    controller.setLevel("addition", 2);
    view.onHomeClick();
    expect(screens).toEqual([{ type: "menu" }]);
  });

  it.each(["addition", "division"] as const)("Back returns to the %s map", topic => {
    const { controller, screens } = setup();
    controller.setLevel(topic, 3);
    view.onBackClick();
    expect(screens).toEqual([{ type: "adventuremap", topic }]);
  });

  it("Back goes to the topic list if no level was opened", () => {
    const { screens } = setup();
    view.onBackClick();
    expect(screens).toEqual([{ type: "maingame" }]);
  });

  it("follows the screen lifecycle", () => {
    const { controller } = setup();
    controller.show();
    expect(view.visible).toBe(true);
    controller.hide();
    expect(view.visible).toBe(false);
  });
});
