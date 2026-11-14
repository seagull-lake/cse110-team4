import { describe, expect, it } from "vitest";
import { STAGE_HEIGHT, STAGE_WIDTH } from "../../constants.ts";
import { BOX_CELL, CELL_WIDTH, COMPACT_CELL, PROBLEM_TOP, ROW_HEIGHT, getProblemLayout } from "./MainProblemLayout.ts";
import type { Cell, ProblemLayout } from "./MainProblemLayout.ts";
import { MainProblemScreenModel } from "./MainProblemScreenModel.ts";
import { solvedDivision } from "./testProblems.ts";

/** The text of each row, read left to right, e.g. ["482", "+315"]. */
function rows(layout: ProblemLayout): string[] {
  const byRow = new Map<number, Cell[]>();
  layout.cells.forEach(cell => byRow.set(cell.y, [...(byRow.get(cell.y) ?? []), cell]));
  return [...byRow.entries()].sort(([a], [b]) => a - b)
    .map(([, cells]) => cells.sort((a, b) => a.x - b.x).map(cell => cell.text).join(""));
}

/** Right edge of the last cell in each row. */
function rowRightEdges(layout: ProblemLayout): number[] {
  const edges = new Map<number, number>();
  layout.cells.forEach(cell => edges.set(cell.y, Math.max(edges.get(cell.y) ?? 0, cell.x + layout.cellSize.width)));
  return [...edges.values()];
}

describe("column layout (addition, subtraction, multiplication)", () => {
  it("writes the numbers on separate rows with the operator in front of the second", () => {
    const layout = getProblemLayout("addition", { operands: [482, 315], answer: 797 });
    expect(rows(layout)).toEqual(["482", "+315"]);
  });

  it("right-aligns numbers of different lengths so the place values line up", () => {
    const layout = getProblemLayout("subtraction", { operands: [14925, 3444, 6235], answer: 5246 });
    expect(rows(layout)).toEqual(["14925", "−3444", "−6235"]);
    expect(new Set(rowRightEdges(layout)).size).toBe(1);
  });

  it("uses the × symbol for multiplication", () => {
    expect(rows(getProblemLayout("multiplication", { operands: [44, 5], answer: 220 }))).toEqual(["44", "×5"]);
  });

  it("puts the operator in its own column, left of every digit", () => {
    const layout = getProblemLayout("addition", { operands: [5, 3], answer: 8 });
    const operator = layout.cells.find(cell => cell.text === "+")!;
    expect(layout.cells.filter(cell => cell !== operator).every(cell => cell.x > operator.x)).toBe(true);
  });

  it("draws the line under the last number, covering the operator and the numbers", () => {
    const layout = getProblemLayout("addition", { operands: [805, 871, 902], answer: 2578 });
    if (layout.kind !== "column") throw new Error("expected a column layout");
    const firstRow = Math.min(...layout.cells.map(cell => cell.y));
    expect(layout.line.y).toBe(firstRow + 3 * ROW_HEIGHT);
    expect(layout.line.x2 - layout.line.x1).toBe(4 * CELL_WIDTH); // operator + 3 digits
  });

  it("keeps the operator next to the longest number even when the answer is longer", () => {
    const layout = getProblemLayout("multiplication", { operands: [82766, 372], answer: 30788952 });
    if (layout.kind !== "column") throw new Error("expected a column layout");
    const operator = layout.cells.find(cell => cell.text === "×")!;
    const longestNumberLeft = Math.min(...layout.cells.filter(cell => cell !== operator).map(cell => cell.x));
    expect(operator.x).toBe(longestNumberLeft - COMPACT_CELL.width);
    expect(layout.line.x2 - layout.line.x1).toBe(8 * COMPACT_CELL.width); // the line covers the 8-digit answer
  });

  it("leaves room under the line for every digit of a longer answer", () => {
    const layout = getProblemLayout("multiplication", { operands: [82766, 372], answer: 30788952 });
    expect(layout.answer.cellXs).toHaveLength(8);
    expect(layout.answer.cellXs.at(-1)! + layout.answer.size.width).toBe(rowRightEdges(layout)[0]);
  });

  it("makes room for the minus sign of a negative answer", () => {
    expect(getProblemLayout("subtraction", { operands: [472, 546], answer: -74 }).answer.cellXs).toHaveLength(3);
  });

  it("is centered on the screen", () => {
    const layout = getProblemLayout("addition", { operands: [61, 38], answer: 99 });
    if (layout.kind !== "column") throw new Error("expected a column layout");
    expect(layout.line.x1 + layout.line.x2).toBe(STAGE_WIDTH);
  });
});

describe("steps of addition, subtraction and multiplication", () => {
  it("puts a carry box above every column from the tens up", () => {
    const layout = getProblemLayout("addition", { operands: [10984, 50789], answer: 61773 });
    if (layout.kind !== "column") throw new Error("expected a column layout");
    const digitsOf = (y: number) => layout.cells.filter(cell => cell.y === y && cell.text !== "+").map(cell => cell.x);
    const topRow = digitsOf(Math.min(...layout.cells.map(cell => cell.y)));
    expect(layout.steps).toHaveLength(4);
    // tens first, then hundreds, ... each straight above its column
    expect(layout.steps.map(step => step.cellXs[0])).toEqual([topRow[3], topRow[2], topRow[1], topRow[0]]);
    layout.steps.forEach(step => expect(step.y + step.size.height).toBeLessThanOrEqual(Math.min(...layout.cells.map(cell => cell.y))));
  });

  it("puts the borrow boxes for subtraction in the same place", () => {
    const layout = getProblemLayout("subtraction", { operands: [702, 58], answer: 644 });
    expect(layout.steps).toHaveLength(2);
    expect(layout.steps[0].cellXs[0]).toBeGreaterThan(layout.steps[1].cellXs[0]);
  });

  it("has no carry row for 1-digit numbers", () => {
    const layout = getProblemLayout("addition", { operands: [4, 3], answer: 7 });
    expect(layout.steps).toHaveLength(0);
    expect(Math.min(...layout.cells.map(cell => cell.y))).toBe(PROBLEM_TOP);
  });

  it("writes the partial products under the line, a second line, then the answer", () => {
    // 44 × 32: 88 and 1320, then 1408
    const layout = getProblemLayout("multiplication", { operands: [44, 32], answer: 1408 });
    if (layout.kind !== "column") throw new Error("expected a column layout");
    const [ones, tens] = layout.steps;
    expect([ones.cellXs.length, tens.cellXs.length]).toEqual([2, 4]);
    expect(ones.y).toBeGreaterThan(layout.line.y);
    expect(tens.y).toBeGreaterThan(ones.y);
    expect(layout.secondLine!.y).toBeGreaterThan(tens.y);
    expect(layout.answer.y).toBeGreaterThan(layout.secondLine!.y);
    // all right-aligned with the numbers
    for (const field of [ones, tens, layout.answer]) {
      expect(field.cellXs.at(-1)! + field.size.width).toBe(rowRightEdges(layout)[0]);
    }
  });

  it("asks for carries instead when multiplying by a 1-digit number", () => {
    const layout = getProblemLayout("multiplication", { operands: [47, 6], answer: 282 });
    if (layout.kind !== "column") throw new Error("expected a column layout");
    expect(layout.steps).toHaveLength(1);
    expect(layout.secondLine).toBeUndefined();
  });
});

describe("division layout (box method)", () => {
  // 9044 ÷ 38 = 238: three steps (200, 30, 8), so three boxes
  const layout = getProblemLayout("division", solvedDivision(9044, 38));
  if (layout.kind !== "division") throw new Error("expected a division layout");
  const [divisorTens, divisorOnes] = layout.cells;
  const dividend = layout.cells.slice(2, 6);
  /** The fields of one box: partial quotient, product, amount left. */
  const boxFields = (box: number) => layout.steps.slice(box * 3, box * 3 + 3);
  const right = (box: number) => layout.boxes[box].x + layout.boxes[box].width;

  it("uses one box per step of the generator's box method", () => {
    expect(layout.boxes).toHaveLength(3);
    expect(layout.steps).toHaveLength(9);
  });

  it("writes the divisor left of the boxes and the dividend in the first box", () => {
    expect([divisorTens, divisorOnes, ...dividend].map(cell => cell.text).join("")).toBe("389044");
    const [first] = layout.boxes;
    expect(divisorOnes.x + BOX_CELL.width).toBeLessThanOrEqual(first.x);
    for (const cell of dividend) {
      expect(cell.x).toBeGreaterThanOrEqual(first.x);
      expect(cell.x + BOX_CELL.width).toBeLessThanOrEqual(right(0));
    }
  });

  it("puts the boxes side by side", () => {
    layout.boxes.slice(1).forEach((box, index) => expect(box.x).toBe(right(index)));
  });

  it("has a field for each number of each box, sized to the right answer", () => {
    // 9044 − 7600 = 1444, 1444 − 1140 = 304, 304 − 304 = 0
    expect(boxFields(0).map(field => field.cellXs.length)).toEqual([3, 4, 4]); // 200, 7600, 1444
    expect(boxFields(1).map(field => field.cellXs.length)).toEqual([2, 4, 3]); // 30, 1140, 304
    expect(boxFields(2).map(field => field.cellXs.length)).toEqual([1, 3, 1]); // 8, 304, 0
  });

  it("puts the partial quotient above the box, and the product and amount left inside it", () => {
    layout.boxes.forEach((box, index) => {
      const [quotient, product, remaining] = boxFields(index);
      expect(quotient.y + BOX_CELL.height).toBeLessThanOrEqual(box.y);
      expect(product.y).toBeGreaterThan(box.y);
      expect(remaining.y).toBeGreaterThan(product.y);
      expect(remaining.y + BOX_CELL.height).toBeLessThanOrEqual(box.y + box.height);
      for (const field of [quotient, product, remaining]) {
        expect(field.cellXs[0]).toBeGreaterThanOrEqual(box.x);
        expect(field.cellXs.at(-1)! + BOX_CELL.width).toBeLessThanOrEqual(right(index));
      }
    });
  });

  it("writes a minus in front of every product and a line above every amount left", () => {
    const minuses = layout.cells.filter(cell => cell.text === "−");
    expect(minuses).toHaveLength(3);
    minuses.forEach((minus, box) => expect(minus.x + BOX_CELL.width).toBe(boxFields(box)[1].cellXs[0]));
    layout.lines.forEach((line, box) => expect(line.y).toBeLessThan(boxFields(box)[2].y));
  });

  it("starts every later box with what was left in the box before", () => {
    expect(layout.carried.map(copy => copy.from)).toEqual([2, 5]);
    expect(layout.carried[0].cellXs).toHaveLength(4); // 1444
    expect(layout.carried[1].y).toBe(dividend[0].y);
  });

  it("puts the answer boxes under the division boxes, right-aligned, with a label", () => {
    const [first] = layout.boxes;
    expect(layout.answer.y).toBeGreaterThan(first.y + first.height);
    expect(layout.answer.cellXs).toHaveLength(3);
    expect(layout.answer.cellXs.at(-1)! + CELL_WIDTH).toBe(right(2));
    expect(layout.answerLabel.right).toBeLessThan(layout.answer.cellXs[0]);
  });

  it("is centered on the screen", () => {
    expect(divisorTens.x + right(2)).toBeCloseTo(STAGE_WIDTH, 0);
  });

  it("needs the generator's box method steps", () => {
    expect(() => getProblemLayout("division", { operands: [9044, 38], answer: 238 })).toThrow("box method");
  });

  it("rejects a division problem without exactly two numbers", () => {
    expect(() => getProblemLayout("division", { operands: [100, 5, 2], answer: 10 })).toThrow("dividend and a divisor");
  });
});

describe("every real level fits on the screen", () => {
  const topics = ["addition", "subtraction", "multiplication", "division"] as const;
  const levels = topics.flatMap(topic => [1, 2, 3, 4, 5].map(difficulty => [topic, difficulty] as const));
  // Keep clear of the Home / Back buttons at the bottom
  const bottomLimit = STAGE_HEIGHT - 80;

  it.each(levels)("%s level %s", (topic, difficulty) => {
    for (let round = 0; round < 50; round++) {
      const model = new MainProblemScreenModel(topic, difficulty);
      const layout = getProblemLayout(topic, model.getProblem());
      const shapes = [
        ...layout.cells.map(cell => ({ ...cell, width: layout.cellSize.width, height: layout.cellSize.height })),
        ...[...layout.steps, layout.answer, ...(layout.kind === "division" ? layout.carried : [])]
          .flatMap(field => field.cellXs.map(x => ({ x, y: field.y, ...field.size }))),
        ...(layout.kind === "division" ? layout.boxes : []),
      ];
      for (const { x, y, width, height } of shapes) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x + width).toBeLessThanOrEqual(STAGE_WIDTH);
        expect(y + height).toBeLessThanOrEqual(bottomLimit);
      }
    }
  });
});
