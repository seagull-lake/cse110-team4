import type { LevelType } from "../../levels/levelConfig.ts";
import type { MainGameProblem } from "../../domain/problem.ts";
import { STAGE_WIDTH } from "../../constants.ts";
import { getOperatorSymbol } from "../AdventureMapScreen/AdventureMapLayout.ts";

// Everything here is plain numbers and strings (no Konva), so it can be unit tested.
// The View only draws what getProblemLayout returns.

/** Every digit sits in its own cell of the same width, so ones, tens, hundreds... line up like on paper. */
export const CELL_WIDTH = 44;
export const ROW_HEIGHT = 56;
export const DIGIT_FONT_SIZE = 44;
/** Top of the problem area, just below the title. */
export const PROBLEM_TOP = 180;
/** Gap between the line under the numbers and the answer row (filled in by the next step). */
const ANSWER_GAP = 12;

/** One character drawn in one cell. x is the cell's left edge, y its top. */
export interface Cell { x: number; y: number; text: string }
export interface HorizontalLine { x1: number; x2: number; y: number }

/** Addition, subtraction and multiplication: numbers stacked, right-aligned, line underneath. */
export interface ColumnLayout {
  kind: "column";
  cells: Cell[];
  line: HorizontalLine;
  /** Where the answer row goes: its top and the left edge of each answer cell, right-aligned. */
  answer: { y: number; cellXs: number[] };
}

/** Division: "divisor ) dividend" with the bracket's bar over the dividend and room above it for the quotient. */
export interface DivisionLayout {
  kind: "division";
  cells: Cell[];
  /** The ")" curve: drawn from top to bottom, bulging right. */
  bracket: { x: number; top: number; bottom: number };
  /** The bar over the dividend, starting at the bracket. */
  bar: HorizontalLine;
  /** The quotient row above the dividend (filled in by the next step). */
  answer: { y: number; cellXs: number[] };
}

export type ProblemLayout = ColumnLayout | DivisionLayout;

/** Digits needed to write the answer, including a "-" for a negative one. */
function answerLength(answer: number): number {
  return String(Math.abs(answer)).length + (answer < 0 ? 1 : 0);
}

/** Left edges of `count` cells that end at `rightEdge`. */
function cellsEndingAt(rightEdge: number, count: number): number[] {
  return Array.from({ length: count }, (_, index) => rightEdge - (count - index) * CELL_WIDTH);
}

function getColumnLayout(type: LevelType, problem: MainGameProblem): ColumnLayout {
  const numbers = problem.operands.map(String);
  // Like on paper, the operator sits right left of the longest number; a longer answer
  // (e.g. 5-digit × 3-digit = 8 digits) only makes the line under the numbers wider.
  const numberColumns = Math.max(...numbers.map(text => text.length));
  const answerColumns = answerLength(problem.answer);
  const columns = Math.max(numberColumns + 1, answerColumns);
  const left = (STAGE_WIDTH - columns * CELL_WIDTH) / 2;
  const right = left + columns * CELL_WIDTH;
  const operatorX = right - (numberColumns + 1) * CELL_WIDTH;

  const cells: Cell[] = [];
  numbers.forEach((text, row) => {
    const y = PROBLEM_TOP + row * ROW_HEIGHT;
    // Like the map cards, every number after the first has the operator in front
    if (row > 0) cells.push({ x: operatorX, y, text: getOperatorSymbol(type) });
    cellsEndingAt(right, text.length).forEach((x, index) => cells.push({ x, y, text: text[index] }));
  });

  const lineY = PROBLEM_TOP + numbers.length * ROW_HEIGHT;
  return {
    kind: "column",
    cells,
    line: { x1: left, x2: right, y: lineY },
    answer: { y: lineY + ANSWER_GAP, cellXs: cellsEndingAt(right, answerColumns) },
  };
}

function getDivisionLayout(problem: MainGameProblem): DivisionLayout {
  const [dividend, divisor] = problem.operands.map(String);
  const quotientColumns = Math.max(answerLength(problem.answer), 1);
  // Divisor cells, one cell for the bracket, then the dividend cells
  const width = (divisor.length + 1 + dividend.length) * CELL_WIDTH;
  const left = (STAGE_WIDTH - width) / 2;
  const right = left + width;
  // The first row is left free for the quotient
  const y = PROBLEM_TOP + ROW_HEIGHT;

  const cells: Cell[] = [
    ...cellsEndingAt(left + divisor.length * CELL_WIDTH, divisor.length).map((x, index) => ({ x, y, text: divisor[index] })),
    ...cellsEndingAt(right, dividend.length).map((x, index) => ({ x, y, text: dividend[index] })),
  ];
  const bracketX = left + divisor.length * CELL_WIDTH + CELL_WIDTH / 3;
  const top = y - 6;
  return {
    kind: "division",
    cells,
    bracket: { x: bracketX, top, bottom: y + ROW_HEIGHT - 6 },
    bar: { x1: bracketX, x2: right, y: top },
    answer: { y: PROBLEM_TOP, cellXs: cellsEndingAt(right, Math.min(quotientColumns, dividend.length)) },
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
