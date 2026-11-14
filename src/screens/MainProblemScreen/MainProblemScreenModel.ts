import { getLevelDefinition } from "../../levels/levelConfig.ts";
import type { LevelDefinition, LevelType } from "../../levels/levelConfig.ts";
import type { MainGameProblem, ProblemRequest } from "../../domain/problem.ts";
import { MainGameProblemGenerator } from "../../problem-engine/MainGameProblemGenerator.ts";
import type { DivisionBox, SolvedMainGameProblem } from "../../problem-engine/MainGameProblemGenerator.ts";
import { MultiplicationDivisionGenerator } from "../../problem-engine/MultiplicationDivisionGenerator.ts";
import { ProblemDispatcher } from "../../problem-engine/ProblemDispatcher.ts";

/** The dispatcher the game uses; tests pass their own. */
export function createProblemDispatcher(): ProblemDispatcher {
  return new ProblemDispatcher(new MainGameProblemGenerator(), new MultiplicationDivisionGenerator());
}

/** Characters needed to write an answer: its digits, plus a "-" when it is negative. */
export function getAnswerLength(answer: number): number {
  return String(Math.abs(answer)).length + (answer < 0 ? 1 : 0);
}

/**
 * One place the student types a number: an in-between step, or the final answer (always last).
 * - Addition / subtraction: the carry / borrow above each column from the tens up
 * - Multiplication: for each digit of the multiplier (ones first), the carries of multiplying by it,
 *   then (with a 2+ digit multiplier) its partial product
 * - Division: every box of the box method (partial quotient, product, amount left)
 */
export interface AnswerField {
  readonly kind: "carry" | "borrow" | "partialProduct" | "partialQuotient" | "product" | "remaining" | "answer";
  /** Carries and borrows: the column, 1 = tens. Partial products: the multiplier digit, 0 = ones. Division: the box. */
  readonly box?: number;
  /** Multiplication carries: the multiplier digit they belong to (0 = ones), the same as the `box` of its partial product. */
  readonly row?: number;
  /** One input box per character of the correct number. */
  readonly length: number;
}

/** Number of columns of the longest number. */
export function getNumberColumns(problem: MainGameProblem): number {
  return Math.max(...problem.operands.map(operand => String(Math.abs(operand)).length));
}

/** The numbers the student writes under the line before adding them up: one per multiplier digit, ones first. */
export function getPartialProducts(problem: MainGameProblem): number[] {
  const [multiplicand, multiplier] = problem.operands;
  return [...String(multiplier)].reverse().map((digit, place) => multiplicand * Number(digit) * 10 ** place);
}

/**
 * One single-digit field above each column from the tens up to the longest number's last column.
 * With `includeCarryOut`, one more field is added in the column left of that (what adding the
 * leftmost column carries over into the answer's extra digit).
 */
function getColumnFields(kind: "carry" | "borrow", columns: number, includeCarryOut = false): AnswerField[] {
  const count = Math.max(columns - 1, 0) + (includeCarryOut ? 1 : 0);
  return Array.from({ length: count }, (_, index) => ({ kind, box: index + 1, length: 1 }));
}

/** The division boxes the generator worked out for this problem. */
export function getDivisionBoxes(problem: MainGameProblem): readonly DivisionBox[] {
  const boxes = (problem as Partial<SolvedMainGameProblem>).solution?.steps[0]?.divisionBoxMethod?.boxes;
  if (!boxes) throw new Error("A division problem needs the generator's box method steps.");
  return boxes;
}

/** The fields to fill in, in the order the student fills them. */
export function getAnswerFields(topic: LevelType, problem: MainGameProblem): AnswerField[] {
  const answer: AnswerField = { kind: "answer", length: getAnswerLength(problem.answer) };
  if (topic === "addition") {
    // Like every box count, this follows the answer: the carry out of the leftmost column is only
    // asked for when it becomes an extra digit of the answer, so no carry ever sits left of the answer's boxes.
    const columns = getNumberColumns(problem);
    return [...getColumnFields("carry", columns, answer.length > columns), answer];
  }
  if (topic === "subtraction") return [...getColumnFields("borrow", getNumberColumns(problem)), answer];
  if (topic === "multiplication") {
    const [multiplicand, multiplier] = problem.operands;
    const columns = String(multiplicand).length;
    const partialProducts = getPartialProducts(problem);
    const multiplierDigits = [...String(multiplier)].reverse().map(Number);
    const rows = multiplierDigits.flatMap((digit, row): AnswerField[] => {
      // The carries of multiplying by this digit, like addition's: one per column from the tens up,
      // plus one more when the product has an extra digit (the carry out of the leftmost column)
      const hasCarryOut = getAnswerLength(multiplicand * digit) > columns;
      const carries = getColumnFields("carry", columns, hasCarryOut).map((field): AnswerField => ({ ...field, row }));
      // With a 1-digit multiplier the only partial product is the answer, so there is no row for it
      if (partialProducts.length === 1) return carries;
      return [...carries, { kind: "partialProduct", box: row, length: getAnswerLength(partialProducts[row]) }];
    });
    return [...rows, answer];
  }
  return [
    ...getDivisionBoxes(problem).flatMap((step, box): AnswerField[] => [
      { kind: "partialQuotient", box, length: getAnswerLength(step.partialQuotient) },
      { kind: "product", box, length: getAnswerLength(step.amountSubtracted) },
      { kind: "remaining", box, length: getAnswerLength(step.remainingAmount) },
    ]),
    answer,
  ];
}

/** The level being played (topic and difficulty), the problem generated for it, and what the student typed. */
export class MainProblemScreenModel {
  private readonly level: LevelDefinition;
  private readonly difficulty: number;
  private readonly problem: SolvedMainGameProblem;
  private answerCorrect = false;
  private readonly fields: readonly AnswerField[];
  /** What the student typed in each field as it reads on screen, e.g. "72"; typing fills it from the right. */
  private readonly entries: string[];
  /** The field that typing goes into. */
  private active = 0;

  constructor(topic: LevelType, difficulty: number, dispatcher: ProblemDispatcher = createProblemDispatcher()) {
    this.level = getLevelDefinition(topic);
    if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > this.level.maxDifficulty) {
      throw new Error(`${topic} has no difficulty ${difficulty}.`);
    }
    this.difficulty = difficulty;
    // The main-game request always returns a MainGameProblem (operands + answer)
    this.problem = dispatcher.generate(this.getProblemRequest()) as SolvedMainGameProblem;
    this.fields = getAnswerFields(this.level.type, this.problem);
    this.entries = this.fields.map(() => "");
  }

  /** What this level asks the problem generator for. */
  getProblemRequest(): ProblemRequest {
    return { gameType: "main-game", operation: this.level.type, difficulty: this.difficulty };
  }

  getTopic(): LevelType { return this.level.type; }
  getDifficulty(): number { return this.difficulty; }
  getProblem(): SolvedMainGameProblem { return this.problem; }

  /** Returns true only when every entered answer character matches the generated answer. */
  checkAnswer(digits: readonly string[]): boolean {
    const expected = String(this.problem.answer);
    this.answerCorrect = digits.length === expected.length &&
      Array.from(expected, (digit, index) => digits[index] === digit).every(Boolean);
    return this.answerCorrect;
  }

  canContinue(): boolean { return this.answerCorrect; }
  getFields(): readonly AnswerField[] { return this.fields; }
  getEntries(): readonly string[] { return [...this.entries]; }
  getActiveField(): number { return this.active; }

  /** One answer box per character of the correct answer. */
  getAnswerLength(): number { return getAnswerLength(this.problem.answer); }

  /** What was typed in the final answer field. */
  getEnteredAnswer(): string { return this.entries[this.fields.length - 1]; }

  /** Moves typing to another field (clicked, or Tab / Shift+Tab). Out-of-range indexes are ignored. */
  selectField(index: number): void {
    if (Number.isInteger(index) && index >= 0 && index < this.fields.length) this.active = index;
  }

  nextField(): void { this.selectField(this.active + 1); }
  previousField(): void { this.selectField(this.active - 1); }

  /**
   * Adds one typed character to the active field. A field is filled from right to left like on paper:
   * the first digit goes in the ones box, the next one in the box to its left, and digits already
   * typed stay where they are. Only digits are accepted, plus "-" as the leftmost character of the
   * answer (subtraction can have a negative answer), which can only be typed once every box to its
   * right is filled. Returns false if it was rejected. A full field moves typing on to the next one.
   */
  typeCharacter(character: string): boolean {
    const field = this.fields[this.active];
    const entry = this.entries[this.active];
    const isDigit = /^[0-9]$/.test(character);
    const isLeadingMinus = character === "-" && field.kind === "answer" && entry.length === field.length - 1;
    if (!isDigit && !isLeadingMinus) return false;
    if (entry.length >= field.length) return false;
    this.entries[this.active] = character + entry;
    if (this.entries[this.active].length === field.length) this.nextField();
    return true;
  }

  /** Backspace: removes the character typed last (the leftmost one), or goes back to the previous field when this one is empty. */
  deleteLastCharacter(): void {
    if (this.entries[this.active] === "") this.previousField();
    this.entries[this.active] = this.entries[this.active].slice(1);
  }

  /** Escape: empties the active field. */
  clearActiveField(): void {
    this.entries[this.active] = "";
  }

  /** Empties every field and starts again at the first one. */
  clearAnswer(): void {
    this.entries.fill("");
    this.active = 0;
  }

  /** The typed answer as a number, or null while nothing (or only "-") has been typed. */
  getAnswerValue(): number | null {
    const entry = this.getEnteredAnswer();
    return /[0-9]/.test(entry) ? Number(entry) : null;
  }

  /** e.g. "Addition – Level 3" */
  getTitle(): string {
    const topic = this.level.type;
    return `${topic[0].toUpperCase()}${topic.slice(1)} – Level ${this.difficulty}`;
  }
}
