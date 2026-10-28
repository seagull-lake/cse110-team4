export type Operation = "addition" | "subtraction" | "multiplication" | "division";
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;
type Range = [number, number];

export const OPERATIONS: Operation[] = ["addition", "subtraction", "multiplication", "division"];

export interface LevelConfig {
  level: DifficultyLevel;
  name: string;
  additionSubtraction: Range;
  multiplication: [Range, Range];
  division: { dividend: Range; divisor: Range };
}

export interface Problem {
  operation: Operation;
  level: DifficultyLevel;
  operands: [number, number];
  expression: string;
  answer: number;
}

// 1. return the number ranges for a level. Both endpoints in [min, max] are inclusive.
export function getLevelConfig(level: DifficultyLevel): LevelConfig {
  if (level === 1) {
    return {
      level: 1, name: "Getting started",
      additionSubtraction: [0, 10],
      multiplication: [[0, 5], [0, 5]],
      division: { dividend: [0, 25], divisor: [1, 5] },
    };
  } else if (level === 2) {
    return {
      level: 2, name: "Fact builder",
      additionSubtraction: [10, 99],
      multiplication: [[0, 10], [0, 10]],
      division: { dividend: [0, 100], divisor: [2, 10] },
    };
  } else if (level === 3) {
    return {
      level: 3, name: "Number explorer",
      additionSubtraction: [100, 999],
      multiplication: [[10, 99], [2, 9]],
      division: { dividend: [10, 99], divisor: [2, 9] },
    };
  } else if (level === 4) {
    return {
      level: 4, name: "Big number challenge",
      additionSubtraction: [1000, 9999],
      multiplication: [[100, 999], [2, 9]],
      division: { dividend: [100, 999], divisor: [2, 9] },
    };
  } else if (level === 5) {
    return {
      level: 5, name: "Math adventurer",
      additionSubtraction: [10000, 99999],
      multiplication: [[10, 99], [10, 99]],
      division: { dividend: [1000, 9999], divisor: [2, 9] },
    };
  }
  throw new RangeError("Level must be an integer from 1 to 5.");
}

//the test page uses this list to populate the difficulty dropdown. for ui
export const LEVELS: LevelConfig[] = [];
const levelNumbers: DifficultyLevel[] = [1, 2, 3, 4, 5];
for (const level of levelNumbers) {
  LEVELS.push(getLevelConfig(level));
}

function validateOperation(operation: Operation): void {
  if (operation !== "addition" && operation !== "subtraction" &&
      operation !== "multiplication" && operation !== "division") {
    throw new RangeError("Unsupported operation.");
  }
}

//2. Generate a random integer from min to max, inclusive.
//for example, min=2 and max=5 can produce 2, 3, 4, or 5.
//callers default to Math.random; tests can supply a deterministic function.
function randomInteger(min: number, max: number, random: () => number): number {
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError("Random source must return a finite number in [0, 1).");
  }
  return Math.floor(value * (max - min + 1)) + min;
}

// 3. generate a problem by selecting the ranges and calculating the answer.
export function generateProblem(
  operation: Operation,
  level: DifficultyLevel,
  random: () => number = Math.random,
): Problem {
  validateOperation(operation);
  const config = getLevelConfig(level);
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
    right = randomInteger(divisorRange[0], divisorRange[1], random);

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

// 4.use a for loop to generate count problems. Repeated problems are possible.
export function generateBatch(
  operation: Operation,
  level: DifficultyLevel,
  count: number,
  random: () => number = Math.random,
): Problem[] {
  validateOperation(operation);
  getLevelConfig(level);
  if (!Number.isInteger(count) || count < 1 || count > 100) {
    throw new RangeError("Count must be an integer from 1 to 100.");
  }

  const problems: Problem[] = [];
  for (let i = 0; i < count; i++) {
    const problem = generateProblem(operation, level, random);
    problems.push(problem);
  }
  return problems;
}

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
