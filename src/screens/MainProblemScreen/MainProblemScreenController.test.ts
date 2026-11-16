import { describe, expect, it, vi } from "vitest";
import type { Screen } from "../../types.ts";
import type { ProblemLayout } from "./MainProblemLayout.ts";
import { MainProblemScreenController } from "./MainProblemScreenController.ts";
import { solvedDivision } from "./testProblems.ts";
import { MainGameProblemGenerator } from "../../problem-engine/MainGameProblemGenerator.ts";
import type { SolvedMainGameProblem } from "../../problem-engine/MainGameProblemGenerator.ts";
import { getAnswerFields } from "./MainProblemScreenModel.ts";
import type { LevelType } from "../../levels/levelConfig.ts";

// Konva can't draw text in tests, so the view is replaced with one that records what it was told
const view = vi.hoisted(() => ({
  onHomeClick: () => {},
  onBackClick: () => {},
  onSubmitClick: () => {},
  onContinueClick: () => {},
  onTryAgainClick: () => {},
  onReviewClick: () => {},
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
  incorrectAnswerShown: false,
  incompleteMessageShown: false,
  submitEnabled: false,
  visible: false,
}));

vi.mock("./MainProblemScreenView.ts", () => ({
  MainProblemScreenView: class {
    constructor(
      onHomeClick: () => void,
      onBackClick: () => void,
      onSubmitClick: () => void,
      onContinueClick: () => void,
      onTryAgainClick: () => void,
      onReviewClick: () => void,
      onKey: (key: string) => void,
      onFieldClick: (index: number) => void,
    ) {
      view.onReviewClick = onReviewClick;
      view.onHomeClick = onHomeClick;
      view.onBackClick = onBackClick;
      view.onSubmitClick = onSubmitClick;
      view.onContinueClick = onContinueClick;
      view.onTryAgainClick = onTryAgainClick;
      view.onKey = onKey;
      view.onFieldClick = onFieldClick;
    }
    showAnswer(entries: readonly string[], active: number) {
      view.entries = entries;
      view.active = active;
      view.answer = entries.at(-1) ?? "";
      view.enteredAnswer = Array.from(
        { length: view.layout?.answer.cellXs.length ?? 0 },
        (_, index) => Array.from(view.answer)[index] ?? "",
      );
    }
    setTitle(title: string) { view.title = title; }
    setProblem(layout: ProblemLayout) {
      view.layout = layout;
      view.enteredAnswer = Array.from({ length: layout.answer.cellXs.length }, () => "");
      view.correctAnswerShown = false;
      view.incorrectAnswerShown = false;
      view.incompleteMessageShown = false;
    }
    getEnteredAnswer() { return view.enteredAnswer; }
    showCorrectAnswer() { view.correctAnswerShown = true; }
    showIncorrectAnswer() { view.incorrectAnswerShown = true; }
    showIncompleteMessage() { view.incompleteMessageShown = true; }
    setSubmitEnabled(enabled: boolean) { view.submitEnabled = enabled; }
    resetForRetry() {
      view.correctAnswerShown = false;
      view.incorrectAnswerShown = false;
      view.incompleteMessageShown = false;
    }
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

  /**
   * Types every field like a student would: each step field is filled with zeros and the answer with
   * `answer` (fields are typed from the ones digit to the left, so the characters go in reversed).
   * With `skipSteps`, only the answer is typed.
   */
  function fillOut(topic: LevelType, problem: SolvedMainGameProblem, answer: string, skipSteps = false) {
    const fields = getAnswerFields(topic, problem);
    fields.forEach((field, index) => {
      view.onFieldClick(index);
      view.onKey("Escape");
      const text = field.kind === "answer" ? answer : skipSteps ? "" : "0".repeat(field.length);
      Array.from(text).reverse().forEach(key => view.onKey(key));
    });
  }
  /** An answer with the right number of boxes that isn't the correct one. */
  function wrongAnswer(problem: SolvedMainGameProblem): string {
    const length = String(problem.answer).length;
    return String(problem.answer) === "9".repeat(length) ? "8".repeat(length) : "9".repeat(length);
  }
  const topics = ["addition", "subtraction", "multiplication", "division"] as const;

  describe("submitting only once everything is filled out", () => {
    it.each(topics)("ignores Submit for %s until every box is filled in", topic => {
      const problem = new MainGameProblemGenerator(() => 0.5).generate({ operation: topic, operandDigits: [3, 2] });
      const { controller, screens } = setup({ generate: () => problem });
      controller.setLevel(topic, 1);
      expect(view.submitEnabled).toBe(false);

      view.onSubmitClick();
      expect(view.incompleteMessageShown).toBe(true);
      expect(view.correctAnswerShown || view.incorrectAnswerShown).toBe(false);

      // Every field but the answer
      fillOut(topic, problem, "", false);
      expect(view.submitEnabled).toBe(false);
      view.onSubmitClick();
      expect(view.correctAnswerShown || view.incorrectAnswerShown).toBe(false);

      fillOut(topic, problem, String(problem.answer));
      expect(view.submitEnabled).toBe(true);
      view.onSubmitClick();
      expect(view.correctAnswerShown).toBe(true);
      expect(screens).toEqual([]);
    });

    it("ignores Submit when only the answer is filled in but a step box is empty", () => {
      const problem = new MainGameProblemGenerator(() => 0.5).generate({ operation: "division", operandDigits: [3, 1] });
      const { controller } = setup({ generate: () => problem });
      controller.setLevel("division", 1);
      fillOut("division", problem, String(problem.answer), true);
      expect(view.submitEnabled).toBe(false);
      view.onSubmitClick();
      expect(view.correctAnswerShown).toBe(false);
      expect(view.incompleteMessageShown).toBe(true);
    });
  });

  it.each(topics)("shows the Incorrect state first after an incorrect %s answer", topic => {
    const problem = new MainGameProblemGenerator(() => 0.5).generate({ operation: topic, operandDigits: [2, 1] });
    const generate = vi.fn(() => problem);
    const { controller, screens } = setup({ generate });
    controller.setLevel(topic, 1);

    fillOut(topic, problem, wrongAnswer(problem));
    view.onSubmitClick();
    expect(view.incorrectAnswerShown).toBe(true);
    expect(view.correctAnswerShown).toBe(false);
    expect(screens).toEqual([]); // stays on this screen; no jump to the solution yet

    // Continue isn't offered after an incorrect answer, and Submit can't be pressed again
    view.onContinueClick();
    view.onSubmitClick();
    expect(screens).toEqual([]);

    view.onReviewClick();
    expect(screens).toEqual([{ type: "solution", problem, topic, difficulty: 1 }]);
    const route = screens[0];
    if (route.type !== "solution") throw new Error("Expected a solution route.");
    expect(route.problem).toBe(problem);
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it("Try Again after an incorrect answer opens a new problem of the same level with every box empty", () => {
    const problem = new MainGameProblemGenerator(() => 0.5).generate({ operation: "addition", operandDigits: [2, 1] });
    const nextProblem = new MainGameProblemGenerator(() => 0.1).generate({ operation: "addition", operandDigits: [2, 1] });
    const generate = vi.fn().mockReturnValueOnce(problem).mockReturnValueOnce(nextProblem);
    const { controller, screens } = setup({ generate });
    controller.setLevel("addition", 1);
    const firstLayout = view.layout;
    fillOut("addition", problem, wrongAnswer(problem));
    view.onSubmitClick();
    expect(view.incorrectAnswerShown).toBe(true);

    view.onTryAgainClick();
    expect(view.incorrectAnswerShown).toBe(false);
    expect(view.layout).not.toEqual(firstLayout);
    expect(view.entries.every(entry => entry === "")).toBe(true);
    expect(view.submitEnabled).toBe(false);
    expect(generate).toHaveBeenCalledTimes(2);
    expect(generate.mock.calls[1][0]).toEqual({ gameType: "main-game", operation: "addition", difficulty: 1 });
    // The new problem hasn't been answered yet, so there is nothing to review
    view.onReviewClick();
    expect(screens).toEqual([]);

    fillOut("addition", nextProblem, String(nextProblem.answer));
    view.onSubmitClick();
    expect(view.correctAnswerShown).toBe(true);
  });

  it("Review Mistakes after Try Again shows the new problem's solution, not the old one", () => {
    const problem = new MainGameProblemGenerator(() => 0.5).generate({ operation: "subtraction", operandDigits: [2, 1] });
    const nextProblem = new MainGameProblemGenerator(() => 0.1).generate({ operation: "subtraction", operandDigits: [2, 1] });
    const generate = vi.fn().mockReturnValueOnce(problem).mockReturnValueOnce(nextProblem);
    const { controller, screens } = setup({ generate });
    controller.setLevel("subtraction", 2);
    fillOut("subtraction", problem, wrongAnswer(problem));
    view.onSubmitClick();
    view.onTryAgainClick();
    fillOut("subtraction", nextProblem, wrongAnswer(nextProblem));
    view.onSubmitClick();
    view.onReviewClick();
    expect(screens).toEqual([{ type: "solution", problem: nextProblem, topic: "subtraction", difficulty: 2 }]);
  });

  it("Try Again does nothing before an answer is submitted", () => {
    const generate = vi.fn(() => new MainGameProblemGenerator(() => 0.5).generate({ operation: "addition", operandDigits: [2, 1] }));
    const { controller } = setup({ generate });
    controller.setLevel("addition", 1);
    view.onTryAgainClick();
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it("offers Try Again and Continue after a correct submission", () => {
    const problem = new MainGameProblemGenerator(() => 0.5).generate({ operation: "addition", operandDigits: [2, 1] });
    const nextProblem = new MainGameProblemGenerator(() => 0.1).generate({ operation: "addition", operandDigits: [2, 1] });
    const generate = vi.fn().mockReturnValueOnce(problem).mockReturnValueOnce(nextProblem);
    const { controller, screens } = setup({ generate });
    controller.setLevel("addition", 1);
    const firstLayout = view.layout;
    fillOut("addition", problem, String(problem.answer));
    view.onSubmitClick();
    expect(view.correctAnswerShown).toBe(true);
    expect(screens).toEqual([]);
    view.onReviewClick();
    expect(screens).toEqual([]);

    view.onTryAgainClick();
    expect(view.correctAnswerShown).toBe(false);
    expect(view.layout).not.toEqual(firstLayout);
    expect(view.answer).toBe("");
    expect(screens).toEqual([]);
    expect(generate).toHaveBeenCalledTimes(2);
    expect(generate.mock.calls[0][0]).toEqual({ gameType: "main-game", operation: "addition", difficulty: 1 });
    expect(generate.mock.calls[1][0]).toEqual(generate.mock.calls[0][0]);

    fillOut("addition", nextProblem, String(nextProblem.answer));
    view.onSubmitClick();
    expect(view.correctAnswerShown).toBe(true);
    view.onContinueClick();
    expect(screens).toEqual([{ type: "adventuremap", topic: "addition" }]);
    expect(generate).toHaveBeenCalledTimes(2);
  });
});
