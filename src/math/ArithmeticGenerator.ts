import type { Operation, DifficultyLevel, Problem, LevelConfig } from "../interfaces/GameInterfaces.ts";
import { resolveLevelConfig } from "./LevelConfiguration.ts";
import { randomInteger } from "./NumberGenerator.ts";
export function validateOperation(operation: Operation): void {
  if (operation !== "addition" && operation !== "subtraction" &&
      operation !== "multiplication" && operation !== "division") {
    throw new RangeError("Unsupported operation.");
  }
}

// 3. generate a problem by selecting the ranges and calculating the answer.
export function generateProblem(operation: Operation,level: DifficultyLevel,random: () => number = Math.random, configuration?: LevelConfig): Problem {
  validateOperation(operation);
  const config = resolveLevelConfig(level, configuration);
  let left = 0;
  let right = 0;
  let answer = 0;
  let symbol = "";

  if (operation === "addition" || operation === "subtraction") {
    const min = config.additionSubtraction[0]; //take min from   additionSubtraction: [0, 10],
    const max = config.additionSubtraction[1];//take max from   additionSubtraction: [0, 10],
    left = randomInteger(min, max, random);
    right = randomInteger(min, max, random);

    if (operation === "addition") {
      answer = left + right;
      symbol = "+";
    } else {
      // subtraction: swap the operands if left < right to avoid negative answers.
      if (left < right) {
        const temp = left;
        left = right;
        right = temp;
      }
      answer = left - right;
      symbol = "−";
    }
  } else if (operation === "multiplication") {
    const leftRange = config.multiplication[0];
    const rightRange = config.multiplication[1];
    left = randomInteger(leftRange[0], leftRange[1], random);
    right = randomInteger(rightRange[0], rightRange[1], random);
    answer = left * right;
    symbol = "×";
  } else if (operation === "division") {
    const divisorRange = config.division.divisor;
    // Only sample divisors that admit an exact quotient inside the dividend range.
    const divisors: number[] = [];
    for (let divisor = divisorRange[0]; divisor <= divisorRange[1]; divisor++) {
      if (Math.ceil(config.division.dividend[0] / divisor) <= Math.floor(config.division.dividend[1] / divisor)) {
        divisors.push(divisor);
      }
    }
    if (divisors.length === 0) throw new RangeError("No exact division is possible with this configuration.");
    right = divisors[randomInteger(0, divisors.length - 1, random)];

    // division: choose a divisor and an integer answer, then multiply to get a dividend with no remainder.
    // for example, with a dividend range of 10–99 and a divisor of 4:
    // The minimum answer is ceil(10/4)=3, and the maximum is floor(99/4)=24.
    // Choosing an answer of 6 produces the problem 24 ÷ 4.
    const minAnswer = Math.ceil(config.division.dividend[0] / right);
    const maxAnswer = Math.floor(config.division.dividend[1] / right);
    answer = randomInteger(minAnswer, maxAnswer, random);
    left = right * answer;
    symbol = "÷";
  }
  return {
    operation: operation,
    level: level,
    operands: [left, right],
    expression: left + " " + symbol + " " + right,
    answer: answer,
  };
}
