import type { MiniGameOneProblem } from "../../domain/problem.ts";
import { MainGameProblemGenerator } from "../../problem-engine/MainGameProblemGenerator.ts";
import { MultiplicationDivisionGenerator } from "../../problem-engine/MultiplicationDivisionGenerator.ts";
import { ProblemDispatcher } from "../../problem-engine/ProblemDispatcher.ts";
import type { Problem } from "./MultiplicationDivisionScreenModel.ts";

// Symbols shown on screen for each Mini Game #1 operation
const OPERATORS = { multiplication: "x", division: "÷" } as const;
export type MiniGameOperation = keyof typeof OPERATORS;

// Mini Game #1 has no levels, so it always asks for the first difficulty
const MINI_GAME_DIFFICULTY = 1;

/** Supplies each round's question by asking the ProblemDispatcher for a Mini Game #1 problem. */
export class MultiplicationDivisionProblems {
    private readonly dispatcher: ProblemDispatcher;
    private readonly random: () => number;

    constructor(
        dispatcher = new ProblemDispatcher(new MainGameProblemGenerator(), new MultiplicationDivisionGenerator()),
        random: () => number = Math.random,
    ) {
        this.dispatcher = dispatcher;
        this.random = random;
    }

    // Picks multiplication or division with equal chance, then converts the result for the screen
    next(): Problem {
        const operation: MiniGameOperation = this.random() < 0.5 ? "multiplication" : "division";
        const result = this.dispatcher.generate({ gameType: "mini-game-1", difficulty: MINI_GAME_DIFFICULTY, operation });
        if (!("answers" in result)) {
            throw new Error("Expected a Mini Game #1 problem.");
        }
        return toGameProblem(operation, result);
    }
}

/** Converts the generator's result into the Problem shape the Mini Game #1 model and view use. */
export function toGameProblem(operation: MiniGameOperation, problem: MiniGameOneProblem): Problem {
    const correct = problem.answers.find(answer => answer.isCorrect);
    if (!correct) {
        throw new Error("A Mini Game #1 problem needs a correct answer.");
    }
    const [firstOperand, secondOperand] = problem.operands;
    return {
        firstOperand,
        operator: OPERATORS[operation],
        secondOperand,
        choices: problem.answers.map(answer => answer.value),
        answer: correct.value,
    };
}
