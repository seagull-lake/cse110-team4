import type { GameProblem, GameRequest, Generators } from "./types.ts";

// Validate the game settings, then pass the full request to the matching generator.
// Generators create problems; a separate Validator checks player answers.
export class GameInterpreter {
    // Store the three generators so generate() can select one by game type.
    private generators: Generators;

    /**
     * Create an interpreter and store the main-game, multiplication/division,
     * and fraction generators. Each must have a generate() method or a TypeError is thrown.
     * Use new GameInterpreter(generators) to create an instance; this does not create a problem.
     */
    constructor(generators: Generators) {
        if (!generators) {
            throw new TypeError("All three generators are required.");
        }
        if (!generators.maingame) {
            throw new TypeError("The main-game generator is required.");
        }
        if (typeof generators.maingame.generate !== "function") {
            throw new TypeError("The main-game generator needs a generate function.");
        }
        if (!generators.multidivgame) {
            throw new TypeError("The multiplication/division generator is required.");
        }
        if (typeof generators.multidivgame.generate !== "function") {
            throw new TypeError("The multiplication/division generator needs a generate function.");
        }

        if (!generators.fractiongame) {
            throw new TypeError("The fraction generator is required.");
        }
        if (typeof generators.fractiongame.generate !== "function") {
            throw new TypeError("The fraction generator needs a generate function.");
        }

        this.generators = generators;
    }

    /**
     * Request a problem using the supplied game settings.
     * @param request An object containing digits (number of digits), game (game type),
     * difficulty, and operation (arithmetic operation).
     * The main game supports all four operations; the multiplication/division game supports
     * only multiplication and division. Omit operation for the fraction comparison game.
     * @returns The selected generator's problem and correct answer, typed as GameProblem.
     * Main-game results contain operands, operation, and answer; multiplication/division
     * results also contain choices and isCorrect (one boolean per option, in the same order).
     * Fraction results contain reference, choices, and answers.
     * Every result includes a game field.
     * @throws If the request is invalid, no generator is called. Generator errors also
     * propagate to the caller.
     */
    generate(request: GameRequest): GameProblem {
        // 1. Check that the caller supplied a request object.
        if (!request) {
            throw new TypeError("A game request is required.");
        }
        if (typeof request !== "object") {
            throw new TypeError("A game request is required.");
        }

        // 2. Require a positive safe integer: 1 means one digit, 2 means two digits.
        // The generator determines the actual numeric ranges.
        if (!Number.isSafeInteger(request.digits)) {
            throw new RangeError("Number of digits must be a positive safe integer.");
        }
        for(let i = 0; i < DOMStringList.length; i++)
        {
           if (request.digits[i] < 1) {
            throw new RangeError("Number of digits must be a positive safe integer.");
        } 
        }

        // 4. Main game: check the operation and pass the full request to its generator.
        // Each return sends the generator's result back to the caller and ends this method.
        if (request.game === "maingame") {
            if (request.operation === "addition") {
                return this.generators.maingame.generate(request); //generate a maingame addition problem(take in request, which contains game type, difficult level, digits, and operation(optional))
            } else if (request.operation === "subtraction") {
                return this.generators.maingame.generate(request);//generate a maingame subtraction problem(take in request, which contains game type, difficult level, digits, and operation(optional))
            } else if (request.operation === "multiplication") {
                return this.generators.maingame.generate(request);
            } else if (request.operation === "division") {
                return this.generators.maingame.generate(request);
            } else {
                throw new RangeError("Unsupported main-game operation.");
            }
        }
        else if (request.game === "multidivgame") { // mini game 1 problem generation
            // Return four choices and their isCorrect flags supplied by the generator.
            if (request.operation === "multiplication") {
                return this.generators.multidivgame.generate(request);
            } else if (request.operation === "division") {
                return this.generators.multidivgame.generate(request);
            } else {
                throw new RangeError("This game requires multiplication or division.");
            }
        }
        else if (request.game === "fractiongame") {
            // Omit the arithmetic operation and return fractions with their correct categories.
            if (request.operation === undefined) {
                return this.generators.fractiongame.generate(request);
            } else {
                throw new RangeError("The fraction comparison game does not use an arithmetic operation.");
            }
        }
        else {
            // Reject game types that do not match any of the three supported games.
            throw new RangeError("Unsupported game module.");
        }
    }
}
