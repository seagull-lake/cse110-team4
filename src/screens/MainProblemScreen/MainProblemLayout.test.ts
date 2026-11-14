import { describe, expect, it } from "vitest";
import { STAGE_HEIGHT, STAGE_WIDTH } from "../../constants.ts";
import { BOX_CELL, CELL_WIDTH, COMPACT_CELL, MARKER_SIZE, PROBLEM_TOP, ROW_HEIGHT, getProblemLayout } from "./MainProblemLayout.ts";
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

  it("adds one more carry box left of the numbers when the sum has an extra digit, so it sits above an answer box", () => {
    const layout = getProblemLayout("addition", { operands: [57, 76], answer: 133 });
    if (layout.kind !== "column") throw new Error("expected a column layout");
    const topRow = layout.cells.filter(cell => cell.y === Math.min(...layout.cells.map(c => c.y)) && cell.text !== "+").map(cell => cell.x);
    expect(layout.steps.map(step => step.cellXs[0])).toEqual([topRow[0], topRow[0] - CELL_WIDTH]);
    expect(layout.answer.cellXs[0]).toBe(topRow[0] - CELL_WIDTH);
  });

  it("never puts a carry box left of the answer's boxes", () => {
    [[53278, 38972], [57, 76], [4, 3], [9, 8], [99999, 99999], [10984, 50789]].forEach(operands => {
      const layout = getProblemLayout("addition", { operands, answer: operands[0] + operands[1] });
      if (layout.kind !== "column") throw new Error("expected a column layout");
      layout.steps.forEach(step => expect(step.cellXs[0]).toBeGreaterThanOrEqual(layout.answer.cellXs[0]));
    });
  });

  it("has no carry boxes for 1-digit addition that stays 1 digit", () => {
    expect(getProblemLayout("addition", { operands: [4, 3], answer: 7 }).steps).toHaveLength(0);
  });

  it("gives 1-digit addition a carry box when the sum has 2 digits", () => {
    const layout = getProblemLayout("addition", { operands: [9, 8], answer: 17 });
    expect(layout.steps).toHaveLength(1);
    expect(layout.steps[0].y).toBe(PROBLEM_TOP);
    expect(Math.min(...layout.cells.map(cell => cell.y))).toBeGreaterThanOrEqual(PROBLEM_TOP + layout.steps[0].size.height);
  });

  it("has no borrow boxes for 1-digit subtraction", () => {
    expect(getProblemLayout("subtraction", { operands: [7, 3], answer: 4 }).steps).toHaveLength(0);
  });

  it("keeps the numbers in the same place whether or not a problem has carry / borrow boxes", () => {
    const topOf = (layout: ProblemLayout) => Math.min(...layout.cells.map(cell => cell.y));
    const lineOf = (layout: ProblemLayout) => layout.kind === "column" ? layout.line.y : NaN;
    const withCarries = getProblemLayout("addition", { operands: [57, 76], answer: 133 });
    [
      getProblemLayout("addition", { operands: [4, 3], answer: 7 }),
      getProblemLayout("addition", { operands: [9, 8], answer: 17 }),
      getProblemLayout("addition", { operands: [10984, 50789], answer: 61773 }),
    ].forEach(layout => {
      expect(topOf(layout)).toBe(topOf(withCarries));
      expect(lineOf(layout)).toBe(lineOf(withCarries));
    });
    // the same for subtraction, with and without borrows
    const withBorrows = getProblemLayout("subtraction", { operands: [74, 8], answer: 66 });
    expect(topOf(getProblemLayout("subtraction", { operands: [7, 3], answer: 4 }))).toBe(topOf(withBorrows));
    // and multiplication by a 1-digit number, with and without carries
    expect(topOf(getProblemLayout("multiplication", { operands: [2, 3], answer: 6 })))
      .toBe(topOf(getProblemLayout("multiplication", { operands: [47, 6], answer: 282 })));
  });

  it("writes the partial products under the line, a second line, then the answer", () => {
    // 44 × 32: 88 and 1320, then 1408
    const layout = getProblemLayout("multiplication", { operands: [44, 32], answer: 1408 });
    if (layout.kind !== "column") throw new Error("expected a column layout");
    const [ones, tens] = layout.steps.filter(step => !step.carry);
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

  it("only asks for carries (no partial product rows) when multiplying by a 1-digit number", () => {
    const layout = getProblemLayout("multiplication", { operands: [47, 6], answer: 282 });
    if (layout.kind !== "column") throw new Error("expected a column layout");
    expect(layout.steps).toHaveLength(2);
    expect(layout.steps.every(step => step.carry && step.row === 0)).toBe(true);
    expect(layout.secondLine).toBeUndefined();
    expect(layout.rowMarkers).toEqual([]);
  });

  describe("multiplication carries", () => {
    const multiplications = [
      [8, 7], [9, 8], [37, 9], [36, 27], [47, 11], [84, 92], [73, 74], [472, 36], [99999, 999],
    ].map(operands => getProblemLayout("multiplication", { operands, answer: operands[0] * operands[1] }));
    const topOf = (layout: ProblemLayout) => Math.min(...layout.cells.map(cell => cell.y));

    it("starts the numbers at the same height on every multiplication problem, like addition and subtraction", () => {
      const addition = getProblemLayout("addition", { operands: [57, 76], answer: 133 });
      multiplications.forEach(layout => expect(topOf(layout)).toBe(topOf(addition)));
    });

    it("draws the carries of every row in the same boxes above the numbers", () => {
      const layout = getProblemLayout("multiplication", { operands: [44, 32], answer: 1408 });
      if (layout.kind !== "column") throw new Error("expected a column layout");
      const carries = layout.steps.filter(step => step.carry);
      expect(carries.map(step => step.row)).toEqual([0, 1, 1]);
      expect(carries.every(step => step.y === PROBLEM_TOP)).toBe(true);
      // row 1's carries start with the same box as row 0's (the tens column)
      expect(carries[1].cellXs).toEqual(carries[0].cellXs);
      expect(carries[2].cellXs[0]).toBe(carries[0].cellXs[0] - COMPACT_CELL.width); // one column left
    });

    it("puts a marker beside each partial product, centered on its row", () => {
      const layout = getProblemLayout("multiplication", { operands: [44, 32], answer: 1408 });
      if (layout.kind !== "column") throw new Error("expected a column layout");
      const partialProducts = layout.steps.filter(step => !step.carry);
      expect(layout.rowMarkers.map(marker => marker.row)).toEqual([0, 1]);
      layout.rowMarkers.forEach((marker, index) => {
        const field = partialProducts[index];
        expect(marker.x).toBeGreaterThan(field.cellXs.at(-1)! + field.size.width);
        expect(marker.y + MARKER_SIZE / 2).toBe(field.y + field.size.height / 2);
      });
    });

    it("knows where each digit of the second number is, ones first, so the one being used can be outlined", () => {
      const layout = getProblemLayout("multiplication", { operands: [44, 32], answer: 1408 });
      if (layout.kind !== "column") throw new Error("expected a column layout");
      const secondRow = layout.cells.filter(cell => cell.y === layout.cells[3].y && cell.text !== "×");
      // 32: the "2" is the ones digit (row 0), the "3" the tens digit (row 1)
      expect(layout.multiplierCells.map(cell => cell.x)).toEqual([secondRow[1].x, secondRow[0].x]);
      expect(secondRow.map(cell => cell.text)).toEqual(["3", "2"]);
      layout.multiplierCells.forEach(cell => expect(cell.y).toBe(secondRow[0].y));
    });

    it("has no multiplier digit cells without partial product rows", () => {
      [getProblemLayout("multiplication", { operands: [47, 6], answer: 282 }),
        getProblemLayout("addition", { operands: [57, 76], answer: 133 })].forEach(layout => {
        if (layout.kind === "column") expect(layout.multiplierCells).toEqual([]);
      });
    });

    it("has no markers for other problems", () => {
      [getProblemLayout("addition", { operands: [57, 76], answer: 133 }), ...multiplications.slice(0, 3)].forEach(layout => {
        if (layout.kind === "column") expect(layout.rowMarkers).toEqual([]);
      });
    });

    it("keeps everything above the Submit button, even for 5-digit × 3-digit", () => {
      const submitTop = STAGE_HEIGHT - 70;
      multiplications.forEach(layout => {
        if (layout.kind !== "column") throw new Error("expected a column layout");
        expect(layout.answer.y + layout.answer.size.height).toBeLessThanOrEqual(submitTop);
      });
    });
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
