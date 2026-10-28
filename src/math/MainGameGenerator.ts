import { generateProblem } from "./ArithmeticGenerator.ts";
import type { MainGameRequest, MainGameProblem, MainGameData, GeneratedProblem } from "../interfaces/GameInterfaces.ts";

export function generateMainGameProblem(request: MainGameRequest, random = Math.random): MainGameProblem {
  const problem = generateProblem(request.operation, request.level, random, request.configuration);
  return { ...createMainGameProblem(problem), level: request.level };
}

export function createMainGameProblem(problem: GeneratedProblem): MainGameData {
  const hints = {
    addition: "Add by place value. Regroup if a column totals ten or more.",
    subtraction: "Subtract by place value. Borrow from the next column when needed.",
    multiplication: "Break a factor into smaller parts, multiply each part, then add.",
    division: "What number multiplied by the divisor gives the dividend?",
  };
  return {
    ...problem,
    game: "main",
    kind: "fill-in-the-blank",
    prompt: problem.expression + " = ___",
    solution: problem.answer,
    hint: hints[problem.operation],
    explanation: problem.expression + " = " + problem.answer + ".",
  };
}
