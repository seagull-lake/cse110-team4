import { describe, expect, it, vi } from "vitest";
import { problemDifficultyConfig } from "../../levels/levelConfig.ts";
import type { LevelType } from "../../levels/levelConfig.ts";
import { MainProblemScreenModel, createProblemDispatcher, getAnswerFields } from "./MainProblemScreenModel.ts";
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
});

describe("filling out the answer", () => {
  /** A level whose problem is fixed, so the answer length is known. */
  const withAnswer = (answer: number, operands = [10, 5]) =>
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

  it("stores the digits the student types", () => {
    const model = withAnswer(72);
    expect(typeAll(model, "72")).toEqual([true, true]);
    expect(model.getEnteredAnswer()).toBe("72");
    expect(model.getAnswerValue()).toBe(72);
  });

  it("keeps a wrong answer as typed (checking happens later)", () => {
    const model = withAnswer(72);
    typeAll(model, "81");
    expect(model.getAnswerValue()).toBe(81);
  });

  it.each(["a", " ", ".", "+", "Enter", "12", "٣"])("rejects %j", character => {
    const model = withAnswer(72);
    expect(model.typeCharacter(character)).toBe(false);
    expect(model.getEnteredAnswer()).toBe("");
  });

  it("stops when every box is filled", () => {
    const model = withAnswer(72);
    expect(typeAll(model, "723")).toEqual([true, true, false]);
    expect(model.getEnteredAnswer()).toBe("72");
  });

  it("lets the student fix a mistake with Backspace", () => {
    const model = withAnswer(72);
    typeAll(model, "73");
    model.deleteLastCharacter();
    model.typeCharacter("2");
    expect(model.getEnteredAnswer()).toBe("72");
  });

  it("does nothing when deleting from an empty answer", () => {
    const model = withAnswer(72);
    model.deleteLastCharacter();
    expect(model.getEnteredAnswer()).toBe("");
  });

  it("clears the whole answer", () => {
    const model = withAnswer(72);
    typeAll(model, "72");
    model.clearAnswer();
    expect(model.getEnteredAnswer()).toBe("");
    expect(model.getAnswerValue()).toBeNull();
  });

  it("accepts a minus only as the first character, for negative answers", () => {
    const model = withAnswer(-74, [472, 546]);
    expect(typeAll(model, "7-")).toEqual([true, false]);
    model.clearAnswer();
    expect(typeAll(model, "-74")).toEqual([true, true, true]);
    expect(model.getAnswerValue()).toBe(-74);
  });

  it("does not count a lone minus as an answer", () => {
    const model = withAnswer(-74, [472, 546]);
    model.typeCharacter("-");
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

  it("only asks for the answer in the other topics", () => {
    expect(getAnswerFields("addition", { operands: [482, 315], answer: 797 })).toEqual([{ kind: "answer", length: 3 }]);
  });

  it.each([1, 2, 3, 4, 5])("division level %s has one set of fields per generator box", difficulty => {
    const model = new MainProblemScreenModel("division", difficulty);
    const boxes = (model.getProblem() as SolvedMainGameProblem).solution.steps[0].divisionBoxMethod!.boxes;
    expect(model.getFields()).toHaveLength(boxes.length * 3 + 1);
  });

  it("stores each field separately and moves on when a field is full", () => {
    const model = open();
    typeAll(model, "2007600");
    expect(model.getEntries().slice(0, 3)).toEqual(["200", "7600", ""]);
    expect(model.getActiveField()).toBe(2);
  });

  it("keeps wrong steps as typed (checking happens later)", () => {
    const model = open();
    typeAll(model, "100");
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
    typeAll(model, "200" + "76");
    model.clearActiveField();
    expect(model.getEntries().slice(0, 2)).toEqual(["200", ""]);
    model.clearAnswer();
    expect(model.getEntries().every(entry => entry === "")).toBe(true);
    expect(model.getActiveField()).toBe(0);
  });

  it("the answer is the last field", () => {
    const model = open();
    model.selectField(9);
    typeAll(model, "238");
    expect(model.getAnswerValue()).toBe(238);
  });
});
