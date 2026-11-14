import { describe, expect, it } from "vitest";
import { getProblemLayout } from "./MainProblemLayout.ts";
import type { FieldLayout } from "./MainProblemLayout.ts";
import { getCarryFieldIndexes, getRowProgress, getShownRow, isHiddenCarry, isWorkingRow } from "./MainProblemRows.ts";
import { MainProblemScreenModel } from "./MainProblemScreenModel.ts";

/** The screen's field list for a problem: the layout's steps, then its answer (the model's order). */
function fieldsOf(topic: "multiplication" | "addition", operands: number[]): FieldLayout[] {
  const layout = getProblemLayout(topic, { operands, answer: topic === "addition" ? operands[0] + operands[1] : operands[0] * operands[1] });
  return [...layout.steps, layout.answer];
}

// 44 × 32 = 1408. Fields in order:
// 0 carry (row 0), 1 partial product (row 0), 2 carry (row 1), 3 carry (row 1), 4 partial product (row 1), 5 answer
const times32 = fieldsOf("multiplication", [44, 32]);
const empty = ["", "", "", "", "", ""];

describe("which row's carries are shown", () => {
  it("is the row of the field being typed in, whether that is one of its carries or its partial product", () => {
    expect([0, 1].map(active => getShownRow(times32, active, 1))).toEqual([0, 0]);
    expect([2, 3, 4].map(active => getShownRow(times32, active, 0))).toEqual([1, 1, 1]);
  });

  it("stays on the last row when the answer is selected", () => {
    expect(getShownRow(times32, 5, 1)).toBe(1);
    expect(getShownRow(times32, 5, 0)).toBe(0);
  });

  it("stays on the previous row when the active field does not exist", () => {
    expect(getShownRow(times32, 42, 1)).toBe(1);
  });

  it("follows addition's fields, which have no rows, without changing", () => {
    expect(getShownRow(fieldsOf("addition", [57, 76]), 0, 0)).toBe(0);
  });
});

describe("a row's carry boxes", () => {
  it("lists the indexes of its carries in the order they are filled in, without its partial product", () => {
    expect(getCarryFieldIndexes(times32, 0)).toEqual([0]);
    expect(getCarryFieldIndexes(times32, 1)).toEqual([2, 3]);
  });

  it("is empty for a row that does not exist", () => {
    expect(getCarryFieldIndexes(times32, 2)).toEqual([]);
  });

  it("is empty for addition, whose carries do not belong to a row", () => {
    expect(getCarryFieldIndexes(fieldsOf("addition", [57, 76]), 0)).toEqual([]);
  });
});

describe("how far a row's carries are filled in", () => {
  it("is empty when none are", () => {
    expect(getRowProgress(times32, empty, 1)).toBe("empty");
  });

  it("is partial when some are", () => {
    expect(getRowProgress(times32, ["", "", "1", "", "", ""], 1)).toBe("partial");
  });

  it("is complete when all are", () => {
    expect(getRowProgress(times32, ["", "", "1", "2", "", ""], 1)).toBe("complete");
    expect(getRowProgress(times32, ["3", "", "", "", "", ""], 0)).toBe("complete");
  });

  it("only counts the row's own carries", () => {
    const entries = ["3", "88", "", "", "1320", "1408"];
    expect(getRowProgress(times32, entries, 0)).toBe("complete");
    expect(getRowProgress(times32, entries, 1)).toBe("empty");
  });

  it("ignores the partial product and the answer", () => {
    expect(getRowProgress(times32, ["", "88", "", "", "1320", "1408"], 0)).toBe("empty");
  });

  it("is null for a row without carries, e.g. 3 × 12 where no product carries", () => {
    const fields = fieldsOf("multiplication", [3, 12]);
    expect(getRowProgress(fields, ["", "", ""], 0)).toBeNull();
    expect(getRowProgress(fields, ["", "", ""], 1)).toBeNull();
  });

  it("is null for a row that does not exist", () => {
    expect(getRowProgress(times32, empty, 7)).toBeNull();
  });

  it("is not fooled by missing entries", () => {
    expect(getRowProgress(times32, [], 0)).toBe("empty");
  });
});

describe("which boxes are drawn", () => {
  it("hides the carries of the other rows, as they share the boxes of the shown row", () => {
    const hidden = (shownRow: number) => times32.map(field => isHiddenCarry(field, shownRow));
    expect(hidden(0)).toEqual([false, false, true, true, false, false]);
    expect(hidden(1)).toEqual([true, false, false, false, false, false]);
  });

  it("never hides a field that is not a multiplication carry", () => {
    fieldsOf("addition", [57, 76]).forEach(field => expect(isHiddenCarry(field, 0)).toBe(false));
  });

  it("outlines the carries and the partial product of the shown row more thickly, but not the answer", () => {
    const working = (shownRow: number) => times32.map(field => isWorkingRow(field, shownRow, true));
    expect(working(0)).toEqual([true, true, false, false, false, false]);
    expect(working(1)).toEqual([false, false, true, true, true, false]);
  });

  it("does not outline anything without partial product rows (a 1-digit multiplier)", () => {
    fieldsOf("multiplication", [47, 6]).forEach(field => expect(isWorkingRow(field, 0, false)).toBe(false));
  });
});

describe("filling out a multiplication, as the student does", () => {
  it("moves through the rows as the student types, with each row's progress following", () => {
    const model = new MainProblemScreenModel("multiplication", 3, { generate: () => ({ operands: [44, 32], answer: 1408 }) } as never);
    const fields = fieldsOf("multiplication", [44, 32]);
    let shownRow = 0;
    const look = () => {
      shownRow = getShownRow(fields, model.getActiveField(), shownRow);
      return { shownRow, row0: getRowProgress(fields, model.getEntries(), 0), row1: getRowProgress(fields, model.getEntries(), 1) };
    };

    expect(look()).toEqual({ shownRow: 0, row0: "empty", row1: "empty" });
    model.typeCharacter("0"); // row 0's only carry; the partial product is next
    expect(look()).toEqual({ shownRow: 0, row0: "complete", row1: "empty" });
    model.nextField(); // skips ahead to row 1's carries
    expect(look()).toEqual({ shownRow: 1, row0: "complete", row1: "empty" });
    model.typeCharacter("1");
    expect(look()).toEqual({ shownRow: 1, row0: "complete", row1: "partial" });
    model.typeCharacter("0");
    expect(look()).toEqual({ shownRow: 1, row0: "complete", row1: "complete" });
    model.selectField(fields.length - 1); // the answer keeps showing the last row, and the circles still show progress
    expect(look()).toEqual({ shownRow: 1, row0: "complete", row1: "complete" });
  });

  it("lines up with the model's fields one for one", () => {
    const problem = { operands: [44, 32], answer: 1408 };
    const model = new MainProblemScreenModel("multiplication", 3, { generate: () => problem } as never);
    expect(model.getFields()).toHaveLength(times32.length);
    model.getFields().forEach((field, index) => {
      expect(field.kind === "carry").toBe(times32[index].carry === true);
      expect(field.length).toBe(times32[index].cellXs.length);
    });
  });
});
