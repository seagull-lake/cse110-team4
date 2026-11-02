import type { MiniGameOneProblem, OperationType, ResolvedProblemParameters } from "../domain/problem.ts";
import type { MiniGameOneProblemGenerator } from "./MiniGameOneProblemGenerator.ts";

/** Mini Game #1 uses natural numbers 0 through 12 (Requirements doc). */
export const MIN_NUMBER = 0;
export const MAX_NUMBER = 12;
export const CHOICE_COUNT = 4;
/** Wrong options are at most this far from the correct answer, so they look believable. */
export const MAX_WRONG_DISTANCE = 5;

interface PickedProblem {
  readonly operands: readonly [number, number];
  readonly answer: number;
}

/** Generates 1 Minute Madness questions: two numbers and four answer choices. */
export class MultiplicationDivisionGenerator implements MiniGameOneProblemGenerator {
  private readonly random: () => number;

  // Sets the random number source. Tests can supply one for predictable questions.
  constructor(random: () => number = Math.random) {
    this.random = random;
  }

  // operandDigits is ignored: the game always uses the 0–12 range instead of digit counts.
  generate(input: ResolvedProblemParameters): MiniGameOneProblem {
    const { operands, answer } = this.pickProblem(input.operation);
    const choices = this.shuffle([answer, ...this.pickWrongOptions(answer)]);
    return {
      operands,
      answers: choices.map(value => ({ value, isCorrect: value === answer })),
    };
  }

  private pickProblem(operation: OperationType): PickedProblem {
    switch (operation) {
      case "multiplication": {
        const left = this.randomInt(MIN_NUMBER, MAX_NUMBER);
        const right = this.randomInt(MIN_NUMBER, MAX_NUMBER);
        return { operands: [left, right], answer: left * right };
      }
      default:
        throw new Error(`Mini Game #1 does not support ${operation}.`);
    }
  }

  // Picks distinct, non-negative numbers near the answer, never the answer itself.
  private pickWrongOptions(answer: number): number[] {
    const nearby: number[] = [];
    for (let distance = 1; distance <= MAX_WRONG_DISTANCE; distance++) {
      nearby.push(answer + distance);
      if (answer - distance >= 0) nearby.push(answer - distance);
    }
    return this.shuffle(nearby).slice(0, CHOICE_COUNT - 1);
  }

  // Fisher–Yates shuffle, so the correct answer is not always in the same spot.
  private shuffle(values: number[]): number[] {
    const shuffled = [...values];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private randomInt(min: number, max: number): number {
    return min + Math.floor(this.random() * (max - min + 1));
  }
}
