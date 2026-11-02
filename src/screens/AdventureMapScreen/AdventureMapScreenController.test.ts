import { describe, expect, it, vi } from "vitest";
import type { Screen } from "../../types.ts";
import { AdventureMapScreenController } from "./AdventureMapScreenController.ts";

// Konva can't draw text in tests, so the view is replaced with one that records what it was told
const view = vi.hoisted(() => ({
  onHomeClick: () => {},
  topic: "",
  visible: false,
}));

vi.mock("./AdventureMapScreenView.ts", () => ({
  AdventureMapScreenView: class {
    constructor(onHomeClick: () => void) { view.onHomeClick = onHomeClick; }
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

  it("follows the screen lifecycle", () => {
    const { controller } = setup();
    controller.show();
    expect(view.visible).toBe(true);
    controller.hide();
    expect(view.visible).toBe(false);
  });
});
