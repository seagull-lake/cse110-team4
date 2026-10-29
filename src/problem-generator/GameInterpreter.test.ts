import { describe, expect, it, vi } from "vitest";
import { GameInterpreter } from "./GameInterpreter.ts";
import type { GameRequest, Generators, MainGameProblem, MultiplicationDivisionProblem, FractionProblem } from "./types.ts";

// Mock generators isolate the interpreter from the actual problem-generation logic.
function setup() {
    const main: MainGameProblem = {
        game: "maingame", operands: [12, 3], operation: "addition", answer: 15,
    };
    const multi: MultiplicationDivisionProblem = {
        game: "multidivgame", operands: [12, 3], operation: "multiplication",
        answer: 36, choices: [24, 36, 48, 60], isCorrect: [false, true, false, false],
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
    return { generators, interpreter: new GameInterpreter(generators), multi };
}

function expectNoGeneratorCalls(generators: Generators) {
    for (const generator of Object.values(generators)) {
        expect(generator.generate).not.toHaveBeenCalled();
    }
}

describe("GameInterpreter", () => {
    it("does not generate a problem during construction", () => {
        const { generators } = setup();
        expectNoGeneratorCalls(generators);
    });

    // GameRequest uses a pair of digit counts and does not require difficulty.
    for (const game of ["maingame", "multidivgame", "fractiongame"] as const) {
        it.each([[1, 1], [2, 1], [1, 3]])(
            `routes ${game} with digit counts [%i, %i]`, (firstDigits, secondDigits) => {
                const { interpreter, generators } = setup();
                const request: GameRequest = { game, digits: [firstDigits, secondDigits] };
                if (game !== "fractiongame") request.operation = "multiplication";

                const result = interpreter.generate(request);

                expect(generators[game].generate).toHaveBeenCalledExactlyOnceWith(request);
                expect(result).toBe(generators[game].generate.mock.results[0].value);
                for (const other of ["maingame", "multidivgame", "fractiongame"] as const) {
                    if (other !== game) expect(generators[other].generate).not.toHaveBeenCalled();
                }
            },
        );
    }

    it.each(["addition", "subtraction", "multiplication", "division"] as const)(
        "supports main-game %s", operation => {
            const { interpreter, generators } = setup();
            const request: GameRequest = { game: "maingame", digits: [2, 1], operation };
            interpreter.generate(request);
            expect(generators.maingame.generate).toHaveBeenCalledExactlyOnceWith(request);
        },
    );

    it.each(["multiplication", "division"] as const)(
        "returns choices, the numeric answer, and boolean flags for %s", operation => {
            const { interpreter, generators, multi } = setup();
            const problem = { ...multi, operation };
            if (operation === "division") problem.operands = [72, 2];
            generators.multidivgame.generate.mockReturnValue(problem);
            const result = interpreter.generate({ game: "multidivgame", digits: [2, 1], operation });
            if (result.game !== "multidivgame") throw new Error("Unexpected game.");
            expect(result.choices).toEqual([24, 36, 48, 60]);
            expect(result.answer).toBe(36);
            expect(result.isCorrect).toEqual([false, true, false, false]);
        },
    );

    it.each([null, undefined, "maingame", 123])("rejects a non-object request: %j", request => {
        const { interpreter, generators } = setup();
        expect(() => interpreter.generate(request as unknown as GameRequest)).toThrow(TypeError);
        expectNoGeneratorCalls(generators);
    });

    it.each([
        undefined, null, 2, [], [1], [1, 2, 3],
        [0, 1], [1, 0], [-1, 1], [1, -1], [1.5, 1], [1, 1.5],
        [NaN, 1], [1, NaN], [Infinity, 1], [1, Infinity],
        ["2", 1], [1, "2"], [Number.MAX_SAFE_INTEGER + 1, 1], [1, Number.MAX_SAFE_INTEGER + 1],
    ].map(digits => ({ digits })))("rejects invalid digit pairs: %j", ({ digits }) => {
        const { interpreter, generators } = setup();
        const request = { game: "maingame", digits, operation: "addition" };
        expect(() => interpreter.generate(request as unknown as GameRequest)).toThrow(RangeError);
        expectNoGeneratorCalls(generators);
    });

    it.each([
        ["menu", "addition", "Unsupported game module."],
        ["maingame", "power", "Unsupported main-game operation."],
        ["maingame", undefined, "Unsupported main-game operation."],
        ["multidivgame", "addition", "This game requires multiplication or division."],
        ["multidivgame", "subtraction", "This game requires multiplication or division."],
        ["multidivgame", undefined, "This game requires multiplication or division."],
        ["fractiongame", "addition", "The fraction comparison game does not use an arithmetic operation."],
    ])("rejects game %s with operation %s", (game, operation, message) => {
        const { interpreter, generators } = setup();
        const request = { game, digits: [1, 1], operation };
        expect(() => interpreter.generate(request as GameRequest)).toThrow(message);
        expectNoGeneratorCalls(generators);
    });

    it.each([null, undefined])("rejects missing generators: %j", generators => {
        expect(() => new GameInterpreter(generators as unknown as Generators)).toThrow(TypeError);
    });

    for (const game of ["maingame", "multidivgame", "fractiongame"] as const) {
        it.each([undefined, {}, { generate: true }])(`rejects an invalid ${game} generator: %j`, value => {
            const { generators } = setup();
            const invalid = { ...generators, [game]: value };
            expect(() => new GameInterpreter(invalid as unknown as Generators)).toThrow(TypeError);
        });

        it(`propagates errors from ${game}`, () => {
            const { interpreter, generators } = setup();
            const error = new Error("Generation failed");
            generators[game].generate.mockImplementation(() => { throw error; });
            const request: GameRequest = { game, digits: [2, 1] };
            if (game !== "fractiongame") request.operation = "multiplication";
            expect(() => interpreter.generate(request)).toThrow(error);
        });
    }
});
