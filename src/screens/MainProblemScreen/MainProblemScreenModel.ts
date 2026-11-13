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
 * One place the student types a number. Division asks for every box of the box method
 * (the partial quotient above it, the product subtracted, and the amount left), then the answer.
 * Every other topic only asks for the answer.
 */
export interface AnswerField {
  readonly kind: "partialQuotient" | "product" | "remaining" | "answer";
  /** Which division box the field belongs to (division boxes only). */
  readonly box?: number;
  /** One input box per character of the correct number. */
  readonly length: number;
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
  if (topic !== "division") return [answer];
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
  private readonly problem: MainGameProblem;
  private readonly fields: readonly AnswerField[];
  /** What the student typed in each field, e.g. "72"; filled from the right like a calculator. */
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
    this.problem = dispatcher.generate(this.getProblemRequest()) as MainGameProblem;
    this.fields = getAnswerFields(this.level.type, this.problem);
    this.entries = this.fields.map(() => "");
  }

  /** What this level asks the problem generator for. */
  getProblemRequest(): ProblemRequest {
    return { gameType: "main-game", operation: this.level.type, difficulty: this.difficulty };
  }

  getTopic(): LevelType { return this.level.type; }
  getDifficulty(): number { return this.difficulty; }
  getProblem(): MainGameProblem { return this.problem; }

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
   * Adds one typed character to the active field. Only digits are accepted, plus "-" as the very
   * first character of the answer (subtraction can have a negative answer). Returns false if it was rejected.
   * A full field moves typing on to the next one.
   */
  typeCharacter(character: string): boolean {
    const field = this.fields[this.active];
    const entry = this.entries[this.active];
    const isDigit = /^[0-9]$/.test(character);
    const isLeadingMinus = character === "-" && entry === "" && field.kind === "answer";
    if (!isDigit && !isLeadingMinus) return false;
    if (entry.length >= field.length) return false;
    this.entries[this.active] = entry + character;
    if (this.entries[this.active].length === field.length) this.nextField();
    return true;
  }

  /** Backspace: removes the last character, or goes back to the previous field when this one is empty. */
  deleteLastCharacter(): void {
    if (this.entries[this.active] === "") this.previousField();
    this.entries[this.active] = this.entries[this.active].slice(0, -1);
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
