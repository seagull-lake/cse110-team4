import { describe, expect, it, vi } from "vitest";
import type { Screen } from "../../types.ts";
import { AdventureMapScreenController } from "./AdventureMapScreenController.ts";

// Konva can't draw text in tests, so the view is replaced with one that records what it was told
const view = vi.hoisted(() => ({
  onHomeClick: () => {},
  onBackClick: () => {},
  topic: "",
  visible: false,
}));

vi.mock("./AdventureMapScreenView.ts", () => ({
  AdventureMapScreenView: class {
    constructor(
      onHomeClick: () => void,
      _onLevelClick: (difficulty: number) => void,
      _onStartClick: () => void,
      onBackClick: () => void,
    ) {
      view.onHomeClick = onHomeClick;
      view.onBackClick = onBackClick;
    }
    setTopic(topic: string) { view.topic = topic; }
    show() { view.visible = true; }
    hide() { view.visible = false; }
  },
}));

function setup() {
  const screens: Screen[] = [];
  const controller = new AdventureMapScreenController({ switchToScreen: (screen) => screens.push(screen) });
  return { controller, screens };
}

describe("adventure map screen controller", () => {
  it.each(["addition", "subtraction", "multiplication", "division"] as const)(
    "shows the %s map", (topic) => {
      const { controller } = setup();
      controller.setTopic(topic);
      expect(controller.getTopic()).toBe(topic);
      expect(view.topic).toBe(topic);
    });

  it("goes back to the menu on Home", () => {
    const { screens } = setup();
    view.onHomeClick();
    expect(screens).toEqual([{ type: "menu" }]);
  });

  it.each(["addition", "subtraction", "multiplication", "division"] as const)(
    "goes back to the topic selection screen on Back to topics from the %s map", (topic) => {
      const { controller, screens } = setup();
      controller.setTopic(topic);
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
