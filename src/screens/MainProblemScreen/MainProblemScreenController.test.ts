import { describe, expect, it, vi } from "vitest";
import type { Screen } from "../../types.ts";
import type { ProblemLayout } from "./MainProblemLayout.ts";
import { MainProblemScreenController } from "./MainProblemScreenController.ts";

// Konva can't draw text in tests, so the view is replaced with one that records what it was told
const view = vi.hoisted(() => ({
  onHomeClick: () => {},
  onBackClick: () => {},
  onSubmitClick: () => {},
  onContinueClick: () => {},
  title: "",
  layout: null as ProblemLayout | null,
  enteredAnswer: [] as string[],
  correctAnswerShown: false,
  visible: false,
}));

vi.mock("./MainProblemScreenView.ts", () => ({
  MainProblemScreenView: class {
    constructor(
      onHomeClick: () => void,
      onBackClick: () => void,
      onSubmitClick: () => void,
      onContinueClick: () => void,
    ) {
      view.onHomeClick = onHomeClick;
      view.onBackClick = onBackClick;
      view.onSubmitClick = onSubmitClick;
      view.onContinueClick = onContinueClick;
    }
    setTitle(title: string) { view.title = title; }
    setProblem(layout: ProblemLayout) {
      view.layout = layout;
      view.enteredAnswer = Array.from({ length: layout.answer.cellXs.length }, () => "");
      view.correctAnswerShown = false;
    }
    getEnteredAnswer() { return view.enteredAnswer; }
    showCorrectAnswer() { view.correctAnswerShown = true; }
    show() { view.visible = true; }
    hide() { view.visible = false; }
  },
}));

function setup(dispatcher?: { generate: () => unknown }) {
  const screens: Screen[] = [];
  const controller = new MainProblemScreenController(
    { switchToScreen: screen => screens.push(screen) }, dispatcher as never,
  );
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

  it("draws the level's problem: an addition problem in columns", () => {
    setup().controller.setLevel("addition", 3);
    expect(view.layout?.kind).toBe("column");
    expect(view.layout?.cells.some(cell => cell.text === "+")).toBe(true);
  });

  it("draws a division problem with the bracket layout", () => {
    setup().controller.setLevel("division", 2);
    expect(view.layout?.kind).toBe("division");
  });

  it("asks for a new problem every time a level is opened", () => {
    let calls = 0;
    const dispatcher = { generate: () => ({ operands: [10 + calls++, 5], answer: 15 }) };
    const controller = new MainProblemScreenController({ switchToScreen: () => {} }, dispatcher as never);
    controller.setLevel("addition", 2);
    const first = view.layout;
    controller.setLevel("addition", 2);
    expect(calls).toBe(2);
    expect(view.layout).not.toEqual(first);
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

  it("only shows correct feedback and continues after a fully correct submission", () => {
    const { controller, screens } = setup({
      generate: () => ({ operands: [482, 315], answer: 797 }),
    });
    controller.setLevel("addition", 1);
    view.enteredAnswer = ["7", "9", "8"];
    view.onSubmitClick();
    expect(view.correctAnswerShown).toBe(false);

    view.onContinueClick();
    expect(screens).toEqual([]);

    view.enteredAnswer = ["7", "9", "7"];
    view.onSubmitClick();
    expect(view.correctAnswerShown).toBe(true);
    view.onContinueClick();
    expect(screens).toEqual([{ type: "adventuremap", topic: "addition" }]);
  });
});
