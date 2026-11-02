import { describe, expect, it, vi } from "vitest";
import { MainGameProblemGenerator } from "../../problem-engine/MainGameProblemGenerator.ts";
import { MultiplicationDivisionGenerator } from "../../problem-engine/MultiplicationDivisionGenerator.ts";
import { ProblemDispatcher } from "../../problem-engine/ProblemDispatcher.ts";
import { MultiplicationDivisionProblems, toGameProblem } from "./MultiplicationDivisionProblems.ts";
import { MultiplicationDivisionScreenModel } from "./MultiplicationDivisionScreenModel.ts";

const generatorResult = {
    operands: [6, 7],
    answers: [
        { value: 40, isCorrect: false },
        { value: 42, isCorrect: true },
        { value: 45, isCorrect: false },
        { value: 39, isCorrect: false },
    ],
};

/** Real dispatcher and generator; the generator's random source is fixed so questions repeat. */
function realDispatcher(): ProblemDispatcher {
    let seed = 0;
    return new ProblemDispatcher(
        new MainGameProblemGenerator(),
        new MultiplicationDivisionGenerator(() => (seed = (seed * 9301 + 49297) % 233280) / 233280),
    );
}

describe("toGameProblem", () => {
    it("converts a multiplication result into the screen's Problem shape", () => {
        expect(toGameProblem("multiplication", generatorResult)).toEqual({
            firstOperand: 6, operator: "x", secondOperand: 7, choices: [40, 42, 45, 39], answer: 42,
        });
    });

    it("shows division with the ÷ symbol", () => {
        const division = { ...generatorResult, operands: [42, 7] };
        expect(toGameProblem("division", division)).toMatchObject({ firstOperand: 42, operator: "÷", secondOperand: 7 });
    });

    it("rejects a result with no correct answer", () => {
        const noCorrect = { ...generatorResult, answers: generatorResult.answers.map(a => ({ ...a, isCorrect: false })) };
        expect(() => toGameProblem("multiplication", noCorrect)).toThrow("needs a correct answer");
    });
});

describe("MultiplicationDivisionProblems", () => {
    it.each([
        [0.2, "multiplication"],
        [0.7, "division"],
    ] as const)("asks the dispatcher for a Mini Game #1 problem (random %s → %s)", (random, operation) => {
        const dispatcher = realDispatcher();
        const generate = vi.spyOn(dispatcher, "generate");
        new MultiplicationDivisionProblems(dispatcher, () => random).next();
        expect(generate).toHaveBeenCalledExactlyOnceWith({ gameType: "mini-game-1", difficulty: 1, operation });
    });

    it("gives questions whose answer is right and is one of the choices", () => {
        let call = 0;
        const problems = new MultiplicationDivisionProblems(realDispatcher(), () => (call++ % 2 === 0 ? 0.2 : 0.7));
        for (let round = 0; round < 200; round++) {
            const problem = problems.next();
            const expected = problem.operator === "x"
                ? problem.firstOperand * problem.secondOperand
                : problem.firstOperand / problem.secondOperand;
            expect(problem.answer).toBe(expected);
            expect(problem.choices).toHaveLength(4);
            expect(problem.choices).toContain(problem.answer);
        }
    });

    it("mixes multiplication and division questions", () => {
        const problems = new MultiplicationDivisionProblems(realDispatcher());
        const operators = new Set(Array.from({ length: 50 }, () => problems.next().operator));
        expect(operators).toEqual(new Set(["x", "÷"]));
    });

    it("works with the game's model to check a clicked choice", () => {
        const problem = new MultiplicationDivisionProblems(realDispatcher(), () => 0.7).next();
        const model = new MultiplicationDivisionScreenModel();
        model.newRound(problem);
        const correctIndex = problem.choices.indexOf(problem.answer);
        expect(model.isCorrectChoice(correctIndex)).toBe(true);
        expect(model.isCorrectChoice((correctIndex + 1) % 4)).toBe(false);
    });
});
