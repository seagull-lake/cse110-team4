import { describe, expect, it, vi } from "vitest";
import type { Screen } from "../../types.ts";
import type { ProblemLayout } from "./MainProblemLayout.ts";
import { MainProblemScreenController } from "./MainProblemScreenController.ts";
import { solvedDivision } from "./testProblems.ts";

// Konva can't draw text in tests, so the view is replaced with one that records what it was told
const view = vi.hoisted(() => ({
  onHomeClick: () => {},
  onBackClick: () => {},
  onSubmitClick: () => {},
  onContinueClick: () => {},
  onKey: (_key: string) => {},
  onFieldClick: (_index: number) => {},
  /** What was typed in each field, and the field being typed in */
  entries: [] as readonly string[],
  active: 0,
  /** The final answer field */
  answer: "",
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
      onKey: (key: string) => void,
      onFieldClick: (index: number) => void,
    ) {
      view.onHomeClick = onHomeClick;
      view.onBackClick = onBackClick;
      view.onSubmitClick = onSubmitClick;
      view.onContinueClick = onContinueClick;
      view.onKey = onKey;
      view.onFieldClick = onFieldClick;
    }
    showAnswer(entries: readonly string[], active: number) {
      view.entries = entries;
      view.active = active;
      view.answer = entries.at(-1) ?? "";
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

  describe("typing the answer", () => {
    /** Opens a level whose answer has 2 digits and no borrow boxes (1-digit numbers). */
    function openLevel() {
      const dispatcher = { generate: () => ({ operands: [9, 3], answer: 72 }) };
      const controller = new MainProblemScreenController({ switchToScreen: () => {} }, dispatcher as never);
      controller.setLevel("subtraction", 1);
      view.answer = "";
      return controller;
    }
    const press = (...keys: string[]) => keys.forEach(key => view.onKey(key));

    it("fills the answer from the right, and the digits already typed stay where they are", () => {
      openLevel();
      press("2");
      expect(view.answer).toBe("2");
      press("7");
      expect(view.answer).toBe("72");
    });

    it("ignores keys that are not digits", () => {
      openLevel();
      press("7", "a", "Shift", " ");
      expect(view.answer).toBe("7");
    });

    it("Backspace removes the last digit and Escape clears the answer", () => {
      openLevel();
      press("7", "3", "Backspace");
      expect(view.answer).toBe("7");
      press("2", "Escape");
      expect(view.answer).toBe("");
    });

    it("starts with an empty answer when a level is opened again", () => {
      const controller = openLevel();
      press("7", "2");
      controller.setLevel("subtraction", 1);
      press("1");
      expect(view.answer).toBe("1");
    });

    it("ignores typing before any level is opened", () => {
      setup();
      view.answer = "";
      press("7");
      expect(view.answer).toBe("");
    });
  });

  describe("filling out the division boxes", () => {
    /** Opens a division level whose problem is 9044 ÷ 38 = 238 (boxes 200, 30 and 8). */
    function openDivision() {
      const dispatcher = { generate: () => solvedDivision(9044, 38) };
      const controller = new MainProblemScreenController({ switchToScreen: () => {} }, dispatcher as never);
      controller.setLevel("division", 3);
      return controller;
    }
    const press = (...keys: string[]) => keys.forEach(key => view.onKey(key));

    it("starts in the first box's partial quotient with every field empty", () => {
      openDivision();
      expect(view.active).toBe(0);
      expect(view.entries).toEqual(Array(10).fill("")); // 3 fields × 3 boxes + the answer
    });

    it("moves on to the next field when one is full", () => {
      openDivision();
      press(..."002", ..."0067", ..."4441"); // each field is typed from its ones digit to the left
      expect(view.entries.slice(0, 3)).toEqual(["200", "7600", "1444"]);
      expect(view.active).toBe(3);
    });

    it("fills every box and then the answer", () => {
      openDivision();
      press(..."002", ..."0067", ..."4441", ..."03", ..."0411", ..."403", ..."8", ..."403", ..."0", ..."832");
      expect(view.entries).toEqual(["200", "7600", "1444", "30", "1140", "304", "8", "304", "0", "238"]);
    });

    it("Tab and Shift+Tab move between fields", () => {
      openDivision();
      press("Tab", "Tab");
      expect(view.active).toBe(2);
      press("Shift+Tab");
      expect(view.active).toBe(1);
    });

    it("clicking a field moves typing there", () => {
      openDivision();
      view.onFieldClick(9);
      press("2");
      expect(view.active).toBe(9);
      expect(view.answer).toBe("2");
    });

    it("Backspace in an empty field goes back to the field before and removes the digit typed last", () => {
      openDivision();
      press(..."002", "Backspace");
      expect(view.active).toBe(0);
      expect(view.entries[0]).toBe("00");
    });
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
