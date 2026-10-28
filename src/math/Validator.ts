import type { Problem, GameProblem, DispatchedProblem, ValidationResult, Fraction, FractionRelation } from "../interfaces/GameInterfaces.ts";
import { compareFractions } from "./FractionGenerator.ts";
// 5. validate input by trimming surrounding whitespace and checking each character for a digit.
export function isWholeNumber(input: string): boolean {
  const text = input.trim();
  if (text === "") {
    return false;
  }
  for (let i = 0; i < text.length; i++) {
    if (text[i] < "0" || text[i] > "9") {
      return false;
    }
  }
  return true;
}

export function checkAnswer(problem: Problem, input: string | number): boolean {
  let value: number;
  if (typeof input === "string") {
    if (!isWholeNumber(input)) {
      return false;
    }
    value = Number(input.trim());
  } else {
    value = input;
  }

  if (!Number.isSafeInteger(value)) {
    return false;
  }
  return value === problem.answer;
}

export function checkFractionRelation(
  reference: Fraction,
  comparison: Fraction,
  relation: FractionRelation,
): boolean {
  return compareFractions(reference, comparison) === relation;
}

function wholeNumber(input: unknown): number | null {
  if (typeof input !== "number" && typeof input !== "string") return null;
  if (typeof input === "string" && !isWholeNumber(input)) return null;
  const value = Number(input);
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

// Return data only. The calling game decides how to display feedback or award points.
export function validateAnswer(problem: GameProblem | DispatchedProblem, input: unknown): ValidationResult {
  if (problem.game === "fraction") {
    const solution = [...problem.solution];
    const valid = Array.isArray(input) && input.length === problem.comparisons.length &&
      Array.from(input).every(value => value === "lesser" || value === "greater" || value === "equal to");
    const results = problem.comparisons.map((fraction, i) =>
      valid && checkFractionRelation(problem.reference, fraction, input[i]));
    const correct = valid && results.every(Boolean);
    return {
      valid, correct, solution, results,
      feedback: !valid ? "Choose a relation for every fraction." :
        correct ? "Correct! All fractions are in the right groups." : "Check the fraction comparisons and try again.",
    };
  }
  const value = wholeNumber(input);
  const valid = value !== null &&
    (problem.game !== "multiplication-division" || problem.choices.includes(value));
  const correct = valid && value === problem.solution;
  const feedback = !valid ? (problem.game === "main" ? "Enter a whole number, such as 24." :
    "Choose one of the four answers.") : correct ? "You got it! Nice work." : "Keep going! Try that problem again.";
  return problem.game === "main"
    ? { valid, correct, feedback, solution: problem.solution, hint: problem.hint, explanation: problem.explanation }
    : { valid, correct, feedback, solution: problem.solution };
}
