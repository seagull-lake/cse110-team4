import { describe, expect, it, vi } from "vitest";
import { problemDifficultyConfig } from "../../levels/levelConfig.ts";
import type { LevelType } from "../../levels/levelConfig.ts";
import { MainProblemScreenModel, createProblemDispatcher, getAnswerFields, getPartialProducts } from "./MainProblemScreenModel.ts";
import type { SolvedMainGameProblem } from "../../problem-engine/MainGameProblemGenerator.ts";
import { solvedDivision } from "./testProblems.ts";

const topics = ["addition", "subtraction", "multiplication", "division"] as const;
const levels = topics.flatMap(topic => [1, 2, 3, 4, 5].map(difficulty => [topic, difficulty] as const));

describe("main problem screen model", () => {
  it("keeps the topic and difficulty of the opened level", () => {
    const model = new MainProblemScreenModel("multiplication", 4);
    expect(model.getTopic()).toBe("multiplication");
    expect(model.getDifficulty()).toBe(4);
    expect(model.getTitle()).toBe("Multiplication – Level 4");
  });

  it.each([1, 5])("accepts level %s", difficulty => {
    expect(new MainProblemScreenModel("addition", difficulty).getDifficulty()).toBe(difficulty);
  });

  it.each([0, 6, 2.5])("rejects level %s", difficulty => {
    expect(() => new MainProblemScreenModel("addition", difficulty)).toThrow("has no difficulty");
  });

  it("rejects an unknown topic", () => {
    expect(() => new MainProblemScreenModel("fractions" as LevelType, 1)).toThrow("Unknown level type");
  });
});

describe("the problem a level asks for", () => {
  it.each(levels)("%s level %s asks the dispatcher for a main-game problem of that level", (topic, difficulty) => {
    const dispatcher = createProblemDispatcher();
    const generate = vi.spyOn(dispatcher, "generate");
    new MainProblemScreenModel(topic, difficulty, dispatcher);
    expect(generate).toHaveBeenCalledExactlyOnceWith({ gameType: "main-game", operation: topic, difficulty });
  });

  it.each(levels)("%s level %s gets numbers with the configured digit counts", (topic, difficulty) => {
    const { operands } = new MainProblemScreenModel(topic, difficulty).getProblem();
    expect(operands.map(operand => String(operand).length))
      .toEqual(problemDifficultyConfig.mainGame[topic][difficulty]);
  });

  it("keeps the problem the dispatcher returned", () => {
    const problem = { operands: [482, 315], answer: 797 };
    const model = new MainProblemScreenModel("addition", 3, { generate: () => problem } as never);
    expect(model.getProblem()).toBe(problem);
  });

  it("only accepts a complete correct answer and only then allows continuing", () => {
    const model = new MainProblemScreenModel(
      "addition", 1, { generate: () => ({ operands: [482, 315], answer: 797 }) } as never,
    );

    expect(model.checkAnswer(["7", "9", "8"])).toBe(false);
    expect(model.canContinue()).toBe(false);
    expect(model.checkAnswer(["7", "9", "7"])).toBe(true);
    expect(model.canContinue()).toBe(true);
  });
});

describe("filling out the answer", () => {
  /** A level whose problem is fixed, so the answer length is known. 1-digit numbers have no borrow boxes. */
  const withAnswer = (answer: number, operands = [9, 3]) =>
    new MainProblemScreenModel("subtraction", 3, { generate: () => ({ operands, answer }) } as never);
  const typeAll = (model: MainProblemScreenModel, text: string) => [...text].map(c => model.typeCharacter(c));

  it("starts empty", () => {
    const model = withAnswer(72);
    expect(model.getEnteredAnswer()).toBe("");
    expect(model.getAnswerValue()).toBeNull();
  });

  it("has one box per answer digit", () => {
    expect(withAnswer(72).getAnswerLength()).toBe(2);
    expect(withAnswer(30788952).getAnswerLength()).toBe(8);
  });

  it("is filled from right to left: the first digit is the ones digit", () => {
    const model = withAnswer(72);
    expect(typeAll(model, "27")).toEqual([true, true]);
    expect(model.getEnteredAnswer()).toBe("72");
    expect(model.getAnswerValue()).toBe(72);
  });

  it("keeps the digits already typed where they are", () => {
    const model = withAnswer(123);
    model.typeCharacter("3");
    expect(model.getEnteredAnswer()).toBe("3");
    model.typeCharacter("2");
    expect(model.getEnteredAnswer()).toBe("23");
    model.typeCharacter("1");
    expect(model.getEnteredAnswer()).toBe("123");
  });

  it("keeps a wrong answer as typed (checking happens later)", () => {
    const model = withAnswer(72);
    typeAll(model, "18");
    expect(model.getAnswerValue()).toBe(81);
  });

  it.each(["a", " ", ".", "+", "Enter", "12", "٣"])("rejects %j", character => {
    const model = withAnswer(72);
    expect(model.typeCharacter(character)).toBe(false);
    expect(model.getEnteredAnswer()).toBe("");
  });

  it("stops when every box is filled", () => {
    const model = withAnswer(72);
    expect(typeAll(model, "273")).toEqual([true, true, false]);
    expect(model.getEnteredAnswer()).toBe("72");
  });

  it("Backspace removes the digit typed last, which is the leftmost one", () => {
    const model = withAnswer(72);
    typeAll(model, "23"); // "32": the 3 is wrong
    model.deleteLastCharacter();
    expect(model.getEnteredAnswer()).toBe("2");
    model.typeCharacter("7");
    expect(model.getEnteredAnswer()).toBe("72");
  });

  it("does nothing when deleting from an empty answer", () => {
    const model = withAnswer(72);
    model.deleteLastCharacter();
    expect(model.getEnteredAnswer()).toBe("");
  });

  it("clears the whole answer", () => {
    const model = withAnswer(72);
    typeAll(model, "27");
    model.clearAnswer();
    expect(model.getEnteredAnswer()).toBe("");
    expect(model.getAnswerValue()).toBeNull();
  });

  it("accepts a minus only in the leftmost box, after the digits, for negative answers", () => {
    const model = withAnswer(-74, [472, 546]);
    model.selectField(2); // after the 2 borrow boxes
    expect(typeAll(model, "4-")).toEqual([true, false]); // a box to the right of the minus is still empty
    model.clearAnswer();
    model.selectField(2);
    expect(typeAll(model, "47-")).toEqual([true, true, true]);
    expect(model.getEnteredAnswer()).toBe("-74");
    expect(model.getAnswerValue()).toBe(-74);
  });

  it("does not accept a minus as the first character", () => {
    const model = withAnswer(-74, [472, 546]);
    model.selectField(2);
    expect(model.typeCharacter("-")).toBe(false);
    expect(model.getAnswerValue()).toBeNull();
  });
});

describe("filling out the division boxes", () => {
  // 9044 ÷ 38 = 238: 9044 − 7600 = 1444, 1444 − 1140 = 304, 304 − 304 = 0
  const open = () => new MainProblemScreenModel("division", 3, { generate: () => solvedDivision(9044, 38) } as never);
  const typeAll = (model: MainProblemScreenModel, text: string) => [...text].forEach(c => model.typeCharacter(c));

  it("asks for every number of every box, then the answer", () => {
    expect(getAnswerFields("division", solvedDivision(9044, 38))).toEqual([
      { kind: "partialQuotient", box: 0, length: 3 }, { kind: "product", box: 0, length: 4 }, { kind: "remaining", box: 0, length: 4 },
      { kind: "partialQuotient", box: 1, length: 2 }, { kind: "product", box: 1, length: 4 }, { kind: "remaining", box: 1, length: 3 },
      { kind: "partialQuotient", box: 2, length: 1 }, { kind: "product", box: 2, length: 3 }, { kind: "remaining", box: 2, length: 1 },
      { kind: "answer", length: 3 },
    ]);
  });


  it.each([1, 2, 3, 4, 5])("division level %s has one set of fields per generator box", difficulty => {
    const model = new MainProblemScreenModel("division", difficulty);
    const boxes = (model.getProblem() as SolvedMainGameProblem).solution.steps[0].divisionBoxMethod!.boxes;
    expect(model.getFields()).toHaveLength(boxes.length * 3 + 1);
  });

  it("stores each field separately and moves on when a field is full", () => {
    const model = open();
    typeAll(model, "002" + "0067"); // each field is typed from its ones digit to the left
    expect(model.getEntries().slice(0, 3)).toEqual(["200", "7600", ""]);
    expect(model.getActiveField()).toBe(2);
  });

  it("keeps wrong steps as typed (checking happens later)", () => {
    const model = open();
    typeAll(model, "001");
    expect(model.getEntries()[0]).toBe("100");
  });

  it("does not move past the last field", () => {
    const model = open();
    model.selectField(9);
    model.nextField();
    expect(model.getActiveField()).toBe(9);
    model.selectField(42);
    expect(model.getActiveField()).toBe(9);
  });

  it("accepts a minus only in the answer", () => {
    const model = open();
    expect(model.typeCharacter("-")).toBe(false);
  });

  it("Escape empties only the active field; clearAnswer empties everything", () => {
    const model = open();
    typeAll(model, "002" + "67");
    model.clearActiveField();
    expect(model.getEntries().slice(0, 2)).toEqual(["200", ""]);
    model.clearAnswer();
    expect(model.getEntries().every(entry => entry === "")).toBe(true);
    expect(model.getActiveField()).toBe(0);
  });

  it("the answer is the last field", () => {
    const model = open();
    model.selectField(9);
    typeAll(model, "832");
    expect(model.getAnswerValue()).toBe(238);
  });
});

describe("filling out the steps of the other topics", () => {
  it("addition asks for the carry above each column from the tens up, then the answer", () => {
    expect(getAnswerFields("addition", { operands: [10984, 50789], answer: 61773 })).toEqual([
      { kind: "carry", box: 1, length: 1 }, { kind: "carry", box: 2, length: 1 },
      { kind: "carry", box: 3, length: 1 }, { kind: "carry", box: 4, length: 1 },
      { kind: "answer", length: 5 },
    ]);
  });

  it("addition asks for one more carry, left of the numbers, when the answer has an extra digit", () => {
    expect(getAnswerFields("addition", { operands: [57, 76], answer: 133 })).toEqual([
      { kind: "carry", box: 1, length: 1 }, { kind: "carry", box: 2, length: 1 },
      { kind: "answer", length: 3 },
    ]);
  });

  it("subtraction asks for the borrows the same way", () => {
    expect(getAnswerFields("subtraction", { operands: [74, 8], answer: 66 })).toEqual([
      { kind: "borrow", box: 1, length: 1 }, { kind: "answer", length: 2 },
    ]);
  });

  it("1-digit numbers have no carries unless the sum has 2 digits", () => {
    expect(getAnswerFields("addition", { operands: [4, 3], answer: 7 })).toEqual([{ kind: "answer", length: 1 }]);
    expect(getAnswerFields("addition", { operands: [9, 8], answer: 17 })).toEqual([
      { kind: "carry", box: 1, length: 1 }, { kind: "answer", length: 2 },
    ]);
  });

  it("1-digit subtraction has no borrows", () => {
    expect(getAnswerFields("subtraction", { operands: [7, 3], answer: 4 })).toEqual([{ kind: "answer", length: 1 }]);
  });

  it("multiplication asks for one partial product per multiplier digit, then the answer", () => {
    // 44 × 32: 44 × 2 = 88, 44 × 30 = 1320, 88 + 1320 = 1408
    expect(getPartialProducts({ operands: [44, 32], answer: 1408 })).toEqual([88, 1320]);
    expect(getAnswerFields("multiplication", { operands: [44, 32], answer: 1408 })).toEqual([
      { kind: "partialProduct", box: 0, length: 2 }, { kind: "partialProduct", box: 1, length: 4 },
      { kind: "answer", length: 4 },
    ]);
  });

  it("multiplication by a 1-digit number asks for the carries instead", () => {
    expect(getAnswerFields("multiplication", { operands: [47, 6], answer: 282 })).toEqual([
      { kind: "carry", box: 1, length: 1 }, { kind: "answer", length: 3 },
    ]);
  });

  it("fills the steps before the answer", () => {
    const model = new MainProblemScreenModel("addition", 2, { generate: () => ({ operands: [48, 35], answer: 83 }) } as never);
    [..."138"].forEach(c => model.typeCharacter(c)); // the carry, then the answer's ones digit first
    expect(model.getEntries()).toEqual(["1", "83"]);
    expect(model.getAnswerValue()).toBe(83);
  });
});
