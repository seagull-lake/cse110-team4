import type { LevelType } from "../../levels/levelConfig.ts";
import type { MainGameProblem } from "../../domain/problem.ts";
import { STAGE_WIDTH } from "../../constants.ts";
import { getOperatorSymbol } from "../AdventureMapScreen/AdventureMapLayout.ts";
import { getAnswerFields, getAnswerLength } from "./MainProblemScreenModel.ts";

// Everything here is plain numbers and strings (no Konva), so it can be unit tested.
// The View only draws what getProblemLayout returns.

/** Every digit sits in its own cell of the same width, so ones, tens, hundreds... line up like on paper. */
export const CELL_WIDTH = 44;
export const ROW_HEIGHT = 56;
export const DIGIT_FONT_SIZE = 44;
/** Top of the problem area, just below the title. */
export const PROBLEM_TOP = 180;
/** Gap between the line under the numbers and the answer boxes. */
const ANSWER_GAP = 12;

/** One character drawn in one cell. x is the cell's left edge, y its top. */
export interface Cell { x: number; y: number; text: string }
export interface HorizontalLine { x1: number; x2: number; y: number }
export interface Rect { x: number; y: number; width: number; height: number }
/** How big the problem's digits are drawn. */
export interface CellSize { width: number; height: number; fontSize: number }

export const COLUMN_CELL: CellSize = { width: CELL_WIDTH, height: ROW_HEIGHT, fontSize: DIGIT_FONT_SIZE };
/** Multiplication with partial products has more rows, so its digits are a little smaller. */
export const COMPACT_CELL: CellSize = { width: 40, height: 44, fontSize: 36 };
/** The carry / borrow boxes above the columns are shorter than a row of digits. */
const CARRY_HEIGHT = 36;
const CARRY_FONT_SIZE = 22;
/** Division digits are smaller so the boxes (3 at most on any level) fit side by side. */
export const BOX_CELL: CellSize = { width: 30, height: 38, fontSize: 26 };
/** Space between a box's edge and the numbers in it. */
export const BOX_PADDING = 8;
/** Rows inside a box: the amount, minus the product, and what is left (with a line above it). */
export const BOX_ROWS = 3;

/**
 * Addition, subtraction and multiplication: numbers stacked, right-aligned, line underneath.
 * Carry / borrow boxes sit above the columns; multiplication's partial products sit under the
 * line, with a second line before the answer.
 */
export interface ColumnLayout {
  kind: "column";
  cellSize: CellSize;
  cells: Cell[];
  line: HorizontalLine;
  /** The line under the partial products (multiplication with a 2+ digit multiplier). */
  secondLine?: HorizontalLine;
  /** The step fields in the model's order: carries / borrows, and partial products. */
  steps: FieldLayout[];
  answer: FieldLayout;
  /**
   * Multiplication with a 2+ digit multiplier: one small marker beside each partial product showing
   * whether the carries of that row are filled in. Empty for every other problem.
   */
  rowMarkers: RowMarker[];
  /**
   * Multiplication with a 2+ digit multiplier: where each digit of the second number is (index 0 = the
   * ones digit, like a partial product's row), so the one being multiplied by can be outlined.
   */
  multiplierCells: Rect[];
}

/** Where one field's input boxes go: their top, the left edge of each (right-aligned), and their size. */
export interface FieldLayout {
  y: number;
  cellXs: number[];
  size: CellSize;
  /** Multiplication: the multiplier digit this field belongs to (0 = ones). */
  row?: number;
  /**
   * Multiplication carries: the carries of every row share the same boxes above the numbers, so only
   * those of the row being worked on are drawn at a time.
   */
  carry?: boolean;
}

/** A marker's top-left corner, for the partial product row of a multiplier digit. */
export interface RowMarker { row: number; x: number; y: number }
/** Size of a row marker, and its distance from the right end of the rows. */
export const MARKER_SIZE = 42; // nearly the height of a partial product row (44), so neighboring circles don't touch
const MARKER_GAP = 14;

/**
 * Division, box method: the divisor on the left, then one box per step. Above each box the student
 * writes the partial quotient; inside it "amount − product", a line, and the amount left.
 * The first box starts with the dividend; every later box starts with what was left in the box before.
 */
export interface DivisionLayout {
  kind: "division";
  /** Size of the digits in and above the boxes (the answer uses the normal size). */
  cellSize: CellSize;
  /** Fixed text: the divisor, the dividend and the "−" signs. */
  cells: Cell[];
  boxes: Rect[];
  /** The line above each box's amount left. */
  lines: HorizontalLine[];
  /** The fields of every box in the model's order: partial quotient, product, amount left. */
  steps: FieldLayout[];
  /** A copy of what the student typed as a box's amount left, shown at the top of the next box. */
  carried: (FieldLayout & { from: number })[];
  /** "Answer" label, right-aligned before the answer boxes. */
  answerLabel: { right: number; y: number };
  /** The final quotient boxes under the division boxes. */
  answer: FieldLayout;
}

export type ProblemLayout = ColumnLayout | DivisionLayout;

/** Left edges of `count` cells that end at `rightEdge`. */
function cellsEndingAt(rightEdge: number, count: number, width = CELL_WIDTH): number[] {
  return Array.from({ length: count }, (_, index) => rightEdge - (count - index) * width);
}

function getColumnLayout(type: LevelType, problem: MainGameProblem): ColumnLayout {
  const fields = getAnswerFields(type, problem);
  const partialProducts = fields.filter(field => field.kind === "partialProduct");
  const size = partialProducts.length > 0 ? COMPACT_CELL : COLUMN_CELL;
  const { width: cell, height: row } = size;

  const numbers = problem.operands.map(String);
  // Like on paper, the operator sits right left of the longest number; a longer answer
  // (e.g. 5-digit × 3-digit = 8 digits) only makes the line under the numbers wider.
  const numberColumns = Math.max(...numbers.map(text => text.length));
  const answerColumns = getAnswerLength(problem.answer);
  const columns = Math.max(numberColumns + 1, answerColumns, ...partialProducts.map(field => field.length));
  const left = (STAGE_WIDTH - columns * cell) / 2;
  const right = left + columns * cell;
  const operatorX = right - (numberColumns + 1) * cell;
  // The carry / borrow row goes above the numbers. Its space is kept even when a problem happens to
  // have no boxes in it (e.g. 2 + 3), so the numbers sit in the same place on every column problem.
  const numbersTop = PROBLEM_TOP + CARRY_HEIGHT + 4;

  const cells: Cell[] = [];
  numbers.forEach((text, index) => {
    const y = numbersTop + index * row;
    // Like the map cards, every number after the first has the operator in front
    if (index > 0) cells.push({ x: operatorX, y, text: getOperatorSymbol(type) });
    cellsEndingAt(right, text.length, cell).forEach((x, digit) => cells.push({ x, y, text: text[digit] }));
  });

  const carrySize = { width: cell, height: CARRY_HEIGHT, fontSize: CARRY_FONT_SIZE };
  const lineY = numbersTop + numbers.length * row;
  let y = lineY + ANSWER_GAP;
  const steps: FieldLayout[] = [];
  const rowMarkers: RowMarker[] = [];
  // In the model's order. Carries / borrows all sit above the numbers (box 1 is the tens column, one
  // cell left of the ones); partial products go under the line, one row each.
  fields.filter(field => field.kind !== "answer").forEach(field => {
    if (field.kind === "partialProduct") {
      steps.push({ y, cellXs: cellsEndingAt(right, field.length, cell), size, row: field.box });
      rowMarkers.push({ row: field.box!, x: right + MARKER_GAP, y: y + (row - MARKER_SIZE) / 2 });
      y += row;
    } else {
      const isMultiplicationCarry = field.row !== undefined;
      steps.push({
        y: PROBLEM_TOP, cellXs: [right - (field.box! + 1) * cell], size: carrySize,
        ...(isMultiplicationCarry && { row: field.row, carry: true }),
      });
    }
  });
  let secondLine: HorizontalLine | undefined;
  if (partialProducts.length > 0) {
    secondLine = { x1: left, x2: right, y: y + 4 };
    y += ANSWER_GAP + 4;
  }
  return {
    kind: "column",
    cellSize: size,
    cells,
    line: { x1: left, x2: right, y: lineY },
    secondLine,
    steps,
    answer: { y, cellXs: cellsEndingAt(right, answerColumns, cell), size },
    rowMarkers,
    multiplierCells: partialProducts.length === 0 ? [] :
      cellsEndingAt(right, numbers[1].length, cell).reverse().map(x => ({ x, y: numbersTop + row, width: cell, height: row })),
  };
}

function getDivisionLayout(problem: MainGameProblem): DivisionLayout {
  const [dividend, divisor] = problem.operands.map(String);
  const { width: cell, height: row } = BOX_CELL;
  const fields = getAnswerFields("division", problem);
  const boxCount = fields.filter(field => field.kind === "partialQuotient").length;
  // Every number in a box is at most as long as the dividend, plus a "−" in front of the product
  const boxWidth = (dividend.length + 1) * cell + BOX_PADDING * 2;
  const boxHeight = BOX_ROWS * row + BOX_PADDING * 2;
  const divisorWidth = divisor.length * cell + BOX_PADDING;
  const left = (STAGE_WIDTH - divisorWidth - boxCount * boxWidth) / 2;
  const boxesLeft = left + divisorWidth;
  // The first row is left free for the partial quotients above the boxes
  const boxTop = PROBLEM_TOP + row + 4;
  const amountY = boxTop + BOX_PADDING;
  const productY = amountY + row;
  const remainingY = productY + row + 4;

  const cells: Cell[] = cellsEndingAt(left + divisor.length * cell, divisor.length, cell)
    .map((x, index) => ({ x, y: amountY, text: divisor[index] }));
  const boxes: Rect[] = [];
  const lines: HorizontalLine[] = [];
  const steps: FieldLayout[] = [];
  const carried: DivisionLayout["carried"] = [];
  const lengthOf = (box: number, kind: string) =>
    fields.find(field => field.box === box && field.kind === kind)!.length;

  for (let box = 0; box < boxCount; box++) {
    const x = boxesLeft + box * boxWidth;
    const right = x + boxWidth - BOX_PADDING;
    boxes.push({ x, y: boxTop, width: boxWidth, height: boxHeight });

    // Starting amount: the dividend, or what was left in the box before
    if (box === 0) {
      cellsEndingAt(right, dividend.length, cell).forEach((cellX, index) => cells.push({ x: cellX, y: amountY, text: dividend[index] }));
    } else {
      const from = steps.length - 1;
      carried.push({ from, y: amountY, cellXs: cellsEndingAt(right, lengthOf(box - 1, "remaining"), cell), size: BOX_CELL });
    }

    const productCells = cellsEndingAt(right, lengthOf(box, "product"), cell);
    cells.push({ x: productCells[0] - cell, y: productY, text: "−" });
    lines.push({ x1: x + BOX_PADDING, x2: right, y: remainingY - 2 });

    steps.push(
      { y: PROBLEM_TOP, cellXs: cellsEndingAt(right, lengthOf(box, "partialQuotient"), cell), size: BOX_CELL },
      { y: productY, cellXs: productCells, size: BOX_CELL },
      { y: remainingY, cellXs: cellsEndingAt(right, lengthOf(box, "remaining"), cell), size: BOX_CELL },
    );
  }

  const right = boxesLeft + boxCount * boxWidth;
  const answer = { y: boxTop + boxHeight + ANSWER_GAP * 2, cellXs: cellsEndingAt(right, getAnswerLength(problem.answer)), size: COLUMN_CELL };
  return {
    kind: "division", cellSize: BOX_CELL, cells, boxes, lines, steps, carried,
    answerLabel: { right: answer.cellXs[0] - ANSWER_GAP, y: answer.y }, answer,
  };
}

/** Where every digit, operator and line of the problem goes, written like on paper. */
export function getProblemLayout(type: LevelType, problem: MainGameProblem): ProblemLayout {
  if (type === "division") {
    if (problem.operands.length !== 2) throw new Error("A division problem needs a dividend and a divisor.");
    return getDivisionLayout(problem);
  }
  return getColumnLayout(type, problem);
}
