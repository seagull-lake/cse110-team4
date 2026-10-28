import { describe, expect, it, vi } from "vitest";
import { GameInterpreter } from "./GameInterpreter.ts";
import type { Difficulty, GameRequest, Generators, MainGameProblem, MultiplicationDivisionProblem, FractionProblem } from "./types.ts";

function setup() {
    const main: MainGameProblem = {
        game: "maingame", operands: [2, 3], operation: "addition", answer: 5,
    };
    const multi: MultiplicationDivisionProblem = {
        game: "multidivgame", operands: [2, 3], operation: "multiplication",
        answer: 6, choices: [3, 6, 9, 12],
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
                    ? { game, difficulty }
                    : { game, difficulty, operation: "multiplication" };
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
            const request = { game: "maingame", difficulty: "easy", operation } as const;
            interpreter.generate(request);
            expect(generators.maingame.generate).toHaveBeenCalledExactlyOnceWith(request);
        },
    );

    it("routes division to the multiplication/division generator", () => {
        const { interpreter, generators } = setup();
        const request = { game: "multidivgame", difficulty: "hard", operation: "division" } as const;
        interpreter.generate(request);
        expect(generators.multidivgame.generate).toHaveBeenCalledExactlyOnceWith(request);
    });

    it.each([
        null, undefined, "maingame", {},
        { game: "menu", difficulty: "easy" },
        { game: "fractiongame", difficulty: "expert" },
        { game: "fractiongame" },
        { game: "maingame", difficulty: "easy", operation: "power" },
        { game: "maingame", difficulty: "easy" },
        { game: "multidivgame", difficulty: "easy", operation: "addition" },
    ])("rejects invalid input %j before dispatch", (request) => {
        const { interpreter, generators } = setup();
        // Simulate untyped callers or invalid persisted data at runtime.
        expect(() => interpreter.generate(request as GameRequest)).toThrow();
        for (const generator of Object.values(generators)) {
            expect(generator.generate).not.toHaveBeenCalled();
        }
    });

    it.each(["maingame", "multidivgame", "fractiongame"] as const)(
        "rejects a missing %s generator", (game) => {
            const { generators } = setup();
            const incomplete = { ...generators, [game]: undefined };
            expect(() => new GameInterpreter(incomplete as Generators)).toThrow(TypeError);
        },
    );

    it("preserves generator failures for the controller", () => {
        const { interpreter, generators } = setup();
        const error = new Error("Generation failed");
        generators.fractiongame.generate.mockImplementation(() => { throw error; });
        expect(() => interpreter.generate({ game: "fractiongame", difficulty: "easy" })).toThrow(error);
    });
});
