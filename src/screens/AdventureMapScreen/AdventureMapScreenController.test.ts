import { describe, expect, it } from "vitest";
import { AdventureMapScreenController } from "./AdventureMapScreenController.ts";
import { AdventureMapScreenView } from "./AdventureMapScreenView.ts";

describe("adventure map screen shell", () => {
  it("exposes the injected view and follows the screen lifecycle", () => {
    const view = new AdventureMapScreenView();
    const controller = new AdventureMapScreenController(view);
    expect(controller.getView()).toBe(view);
    expect(view.getGroup().visible()).toBe(false);
    controller.show();
    expect(view.getGroup().visible()).toBe(true);
    controller.hide();
    expect(view.getGroup().visible()).toBe(false);
  });
});
