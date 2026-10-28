import { generateProblem } from "./ArithmeticGenerator.ts";
import { randomInteger } from "./NumberGenerator.ts";
import type { MultipleChoiceRequest, MultipleChoiceProblem, MultipleChoiceGameData, GeneratedProblem } from "../interfaces/GameInterfaces.ts";

export function generateMultipleChoiceProblem(
  request: MultipleChoiceRequest,
  random = Math.random,
): MultipleChoiceProblem {
  if (request.operation !== "multiplication" && request.operation !== "division") {
    throw new RangeError("This mini game supports multiplication and division only.");
  }
  const problem = generateProblem(request.operation, request.level, random, request.configuration);
  return { ...createMultipleChoiceProblem(problem, random), level: request.level };
}

export function createMultipleChoiceProblem(problem: GeneratedProblem, random = Math.random): MultipleChoiceGameData {
  if (problem.operation !== "multiplication" && problem.operation !== "division") {
    throw new RangeError("This mini game supports multiplication and division only.");
  }
  // Bounded construction works even with a constant random source and a zero answer.
  const choices: number[] = [problem.answer];
  for (const candidate of [problem.answer - 1, problem.answer + 1, problem.answer + 2, problem.answer + 3]) {
    if (candidate >= 0 && choices.length < 4) choices.push(candidate);
  }
  for (let i = choices.length - 1; i > 0; i--) {
    const j = randomInteger(0, i, random);
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return {
    ...problem,
    game: "multiplication-division",
    kind: "multiple-choice",
    prompt: problem.expression + " = ?",
    choices: choices as MultipleChoiceProblem["choices"],
    solution: problem.answer,
  };
}
