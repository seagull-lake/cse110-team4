import { createMainGameProblem, generateMainGameProblem } from "./MainGameGenerator.ts";
import { createMultipleChoiceProblem, generateMultipleChoiceProblem } from "./MultiplicationDivisionGenerator.ts";
import { generateDigitFractionProblem, generateFractionProblem } from "./FractionGenerator.ts";
import { generateProblem } from "./DigitProblemGenerator.ts";
import type { GameRequest, GameProblem, GameGenerationRequest, DispatchedProblem } from "../interfaces/GameInterfaces.ts";

// Route the game module and difficulty to the appropriate generator.
export function generateGameProblem(request: GameRequest, random = Math.random): GameProblem {
  if (!request || typeof request !== "object") throw new RangeError("A game request is required.");
  switch (request.game) {
    case "main": return generateMainGameProblem(request, random);
    case "multiplication-division": return generateMultipleChoiceProblem(request, random);
    case "fraction": return generateFractionProblem(request, random);
    default: throw new RangeError("Unsupported game module.");
  }
}

// Thin dispatcher: only route requests; MVC and difficulty selection stay in the games.
export function dispatchProblem(request: GameGenerationRequest, random = Math.random): DispatchedProblem {
  if (!request || typeof request !== "object") throw new RangeError("A game request is required.");
  switch (request.game) {
    case "main":
      return createMainGameProblem(generateProblem(request.leftDigits, request.rightDigits, request.operation, random));
    case "multiplication-division":
      if (request.operation !== "multiplication" && request.operation !== "division") {
        throw new RangeError("This mini game supports multiplication and division only.");
      }
      return createMultipleChoiceProblem(generateProblem(request.leftDigits, request.rightDigits, request.operation, random), random);
    case "fraction":
      return generateDigitFractionProblem(request, random);
    default:
      throw new RangeError("Unsupported game module.");
  }
}
