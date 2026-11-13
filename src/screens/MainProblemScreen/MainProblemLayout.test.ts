import { describe, expect, it } from "vitest";
import { STAGE_HEIGHT, STAGE_WIDTH } from "../../constants.ts";
import { CELL_WIDTH, PROBLEM_TOP, ROW_HEIGHT, getProblemLayout } from "./MainProblemLayout.ts";
import type { Cell, ProblemLayout } from "./MainProblemLayout.ts";
import { MainProblemScreenModel } from "./MainProblemScreenModel.ts";

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
  layout.cells.forEach(cell => edges.set(cell.y, Math.max(edges.get(cell.y) ?? 0, cell.x + CELL_WIDTH)));
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
    expect(layout.line.y).toBe(PROBLEM_TOP + 3 * ROW_HEIGHT);
    expect(layout.line.x2 - layout.line.x1).toBe(4 * CELL_WIDTH); // operator + 3 digits
  });

  it("keeps the operator next to the longest number even when the answer is longer", () => {
    const layout = getProblemLayout("multiplication", { operands: [82766, 372], answer: 30788952 });
    if (layout.kind !== "column") throw new Error("expected a column layout");
    const operator = layout.cells.find(cell => cell.text === "×")!;
    const longestNumberLeft = Math.min(...layout.cells.filter(cell => cell !== operator).map(cell => cell.x));
    expect(operator.x).toBe(longestNumberLeft - CELL_WIDTH);
    expect(layout.line.x2 - layout.line.x1).toBe(8 * CELL_WIDTH); // the line covers the 8-digit answer
  });

  it("leaves room under the line for every digit of a longer answer", () => {
    const layout = getProblemLayout("multiplication", { operands: [82766, 372], answer: 30788952 });
    expect(layout.answer.cellXs).toHaveLength(8);
    expect(layout.answer.cellXs.at(-1)! + CELL_WIDTH).toBe(rowRightEdges(layout)[0]);
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

describe("division layout", () => {
  const layout = getProblemLayout("division", { operands: [9044, 38], answer: 238 });

  it("writes divisor, then dividend, on one row", () => {
    expect(rows(layout)).toEqual(["389044"]);
    const divisorRight = layout.cells[1].x + CELL_WIDTH;
    expect(layout.cells[2].x).toBe(divisorRight + CELL_WIDTH); // one cell left free for the bracket
  });

  it("puts the bracket between them and the bar over the dividend", () => {
    if (layout.kind !== "division") throw new Error("expected a division layout");
    const dividendLeft = layout.cells[2].x;
    expect(layout.bracket.x).toBeLessThan(dividendLeft);
    expect(layout.bracket.x).toBeGreaterThan(layout.cells[1].x + CELL_WIDTH - 1);
    expect(layout.bar.x1).toBe(layout.bracket.x);
    expect(layout.bar.x2).toBe(layout.cells.at(-1)!.x + CELL_WIDTH);
    expect(layout.bar.y).toBeLessThan(layout.cells[0].y);
  });

  it("leaves the row above the dividend free for the quotient, right-aligned", () => {
    expect(layout.answer.y).toBeLessThan(layout.cells[0].y);
    expect(layout.answer.cellXs).toHaveLength(3);
    expect(layout.answer.cellXs.at(-1)).toBe(layout.cells.at(-1)!.x);
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
      for (const x of [...layout.cells.map(cell => cell.x), ...layout.answer.cellXs]) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x + CELL_WIDTH).toBeLessThanOrEqual(STAGE_WIDTH);
      }
      expect(Math.max(...layout.cells.map(cell => cell.y), layout.answer.y) + ROW_HEIGHT).toBeLessThanOrEqual(bottomLimit);
    }
  });
});
