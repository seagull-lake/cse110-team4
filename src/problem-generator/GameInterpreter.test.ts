import { describe, expect, it, vi } from "vitest";
import { GameInterpreter } from "./GameInterpreter.ts";
import type { Difficulty, GameRequest, Generators, MainGameProblem, MultiplicationDivisionProblem, FractionProblem } from "./types.ts";

function setup() {
    const main: MainGameProblem = {
        game: "maingame", operands: [2, 3], operation: "addition", answer: 5,
    };
    const multi: MultiplicationDivisionProblem = {
        game: "multidivgame", operands: [2, 3], operation: "multiplication",
        answer: 6, choices: [3, 6, 9, 12], isCorrect: [false, true, false, false],
    };
    const fraction: FractionProblem = {
        game: "fractiongame", reference: { numerator: 1, denominator: 2 },
        choices: [{ numerator: 1, denominator: 3 }], answers: ["lesser"],
    };
    const generators = {
        maingame: { generate: vi.fn(() => main) },
        multidivgame: { generate: vi.fn(() => multi) },
        fractiongame: { generate: vi.fn(() => fraction) },
    } satisfies Generators;
    return { generators, interpreter: new GameInterpreter(generators), main, multi, fraction };
}

describe("GameInterpreter", () => {
    for (const difficulty of ["easy", "medium", "hard"] satisfies Difficulty[]) {
        for (const game of ["maingame", "multidivgame", "fractiongame"] as const) {
            it(`routes ${game} at ${difficulty} with the full request`, () => {
                const { interpreter, generators } = setup();
                const request: GameRequest = game === "fractiongame"
                    ? { game, difficulty, digits: 2 }
                    : { game, difficulty, digits: 2, operation: "multiplication" };
                const result = interpreter.generate(request);
                expect(generators[game].generate).toHaveBeenCalledExactlyOnceWith(request);
                expect(result).toBe(generators[game].generate.mock.results[0].value);
                for (const other of ["maingame", "multidivgame", "fractiongame"] as const) {
                    if (other !== game) expect(generators[other].generate).not.toHaveBeenCalled();
                }
            });
        }
    }

    it.each(["addition", "subtraction", "multiplication", "division"] as const)(
        "passes main-game operation %s through unchanged", (operation) => {
            const { interpreter, generators } = setup();
            const request = { game: "maingame", difficulty: "easy", digits: 2, operation } as const;
            interpreter.generate(request);
            expect(generators.maingame.generate).toHaveBeenCalledExactlyOnceWith(request);
        },
    );

    it("routes division to the multiplication/division generator", () => {
        const { interpreter, generators } = setup();
        const request = { game: "multidivgame", difficulty: "hard", digits: 3, operation: "division" } as const;
        interpreter.generate(request);
        expect(generators.multidivgame.generate).toHaveBeenCalledExactlyOnceWith(request);
    });

    it.each(["multiplication", "division"] as const)(
        "returns the options and boolean answer flags for %s", operation => {
            const { interpreter, generators, multi } = setup();
            const problem: MultiplicationDivisionProblem = {
                ...multi,
                operation,
                operands: operation === "multiplication" ? [2, 3] : [12, 2],
            };
            generators.multidivgame.generate.mockReturnValue(problem);
            const result = interpreter.generate({
                game: "multidivgame", digits: 1, difficulty: "easy", operation,
            });
            if (result.game !== "multidivgame") throw new Error("Unexpected game.");
            expect(result.choices).toEqual([3, 6, 9, 12]);
            expect(result.isCorrect).toEqual([false, true, false, false]);
            for (let index = 0; index < result.choices.length; index++) {
                expect(result.isCorrect[index]).toBe(result.choices[index] === result.answer);
            }
        },
    );

    it.each([
        null, undefined, "maingame", {},
        { game: "menu", difficulty: "easy", digits: 1 },
        { game: "fractiongame", difficulty: "expert", digits: 1 },
        { game: "fractiongame" },
        { game: "maingame", difficulty: "easy", digits: 2, operation: "power" },
        { game: "maingame", difficulty: "easy", digits: 1 },
        { game: "multidivgame", difficulty: "easy", digits: 2, operation: "addition" },
        { game: "fractiongame", difficulty: "easy", digits: 1, operation: "addition" },
    ])("rejects invalid input %j before dispatch", (request) => {
        const { interpreter, generators } = setup();
        // Simulate untyped callers or invalid persisted data at runtime.
        expect(() => interpreter.generate(request as GameRequest)).toThrow();
        for (const generator of Object.values(generators)) {
            expect(generator.generate).not.toHaveBeenCalled();
        }
    });

    for (const game of ["maingame", "multidivgame", "fractiongame"] as const) {
        it.each([1, 2, 3, 4])(`passes the digit count to ${game}`, (digits) => {
            const { interpreter, generators } = setup();
            const request: GameRequest = game === "fractiongame"
                ? { game, difficulty: "medium", digits }
                : { game, difficulty: "medium", digits, operation: "multiplication" };
            interpreter.generate(request);
            expect(generators[game].generate).toHaveBeenCalledExactlyOnceWith(request);
        });

        it.each([undefined, null, 0, -1, 1.5, NaN, Infinity, "2", Number.MAX_SAFE_INTEGER + 1])(
            `rejects invalid digits %j for ${game} before dispatch`, (digits) => {
                const { interpreter, generators } = setup();
                const request = { game, difficulty: "easy", digits, operation: "multiplication" };
                expect(() => interpreter.generate(request as GameRequest)).toThrow(RangeError);
                for (const generator of Object.values(generators)) {
                    expect(generator.generate).not.toHaveBeenCalled();
                }
            },
        );
    }

    it.each(["maingame", "multidivgame", "fractiongame"] as const)(
        "rejects a missing %s generator", (game) => {
            const { generators } = setup();
            const incomplete = { ...generators, [game]: undefined };
            expect(() => new GameInterpreter(incomplete as Generators)).toThrow(TypeError);
            const nonCallable = { ...generators, [game]: { generate: true } };
            expect(() => new GameInterpreter(nonCallable as unknown as Generators)).toThrow(TypeError);
        },
    );

    it("preserves generator failures for the controller", () => {
        const { interpreter, generators } = setup();
        const error = new Error("Generation failed");
        generators.fractiongame.generate.mockImplementation(() => { throw error; });
        expect(() => interpreter.generate({ game: "fractiongame", difficulty: "easy", digits: 1 })).toThrow(error);
    });
});
