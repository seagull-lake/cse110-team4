import { getDigitRange, randomInteger } from "./NumberGenerator.ts";
import type { GeneratedProblem, Operation } from "../interfaces/ProblemGeneration.ts";

export function generateProblem(
  leftDigits: number,
  rightDigits: number,
  operation: Operation,
  random: () => number = Math.random,
): GeneratedProblem {
  if (operation !== "addition" && operation !== "subtraction" &&
      operation !== "multiplication" && operation !== "division") {
    throw new RangeError("Unsupported operation.");
  }
  const [leftMin, leftMax] = getDigitRange(leftDigits);
  const [rightMin, rightMax] = getDigitRange(rightDigits);
  if ((operation === "subtraction" || operation === "division") && leftDigits < rightDigits) {
    throw new RangeError("Subtraction and exact division require at least as many digits in the first operand.");
  }
  if (operation === "multiplication" &&
      BigInt(leftMax) * BigInt(rightMax) > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError("These digit counts can produce a multiplication answer outside the safe integer range.");
  }

  let left: number;
  let right: number;
  if (operation === "division") {
    right = randomInteger(rightMin, rightMax, random);
    const quotientMin = Math.ceil(leftMin / right);
    const quotientMax = Math.floor(leftMax / right);
    const quotient = randomInteger(quotientMin, quotientMax, random);
    left = right * quotient;
  } else {
    left = randomInteger(leftMin, leftMax, random);
    right = randomInteger(rightMin, rightMax, random);
    // Swapping equal-length operands preserves the requested digit counts.
    if (operation === "subtraction" && left < right) [left, right] = [right, left];
  }

  const answer = operation === "addition" ? left + right :
    operation === "subtraction" ? left - right :
    operation === "multiplication" ? left * right : left / right;
  const symbol = operation === "addition" ? "+" : operation === "subtraction" ? "−" :
    operation === "multiplication" ? "×" : "÷";
  return { operation, operands: [left, right], expression: left + " " + symbol + " " + right, answer };
}

// Use the complete problem when the game needs the operands as well as the answer.
export function generateAnswer(
  leftDigits: number,
  rightDigits: number,
  operation: Operation,
  random: () => number = Math.random,
): number {
  return generateProblem(leftDigits, rightDigits, operation, random).answer;
}
