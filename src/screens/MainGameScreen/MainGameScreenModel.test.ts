import { describe, expect, it, vi } from "vitest";
import { MainGameScreenModel } from "./MainGameScreenModel.ts";
import {
    ADDITION_LEVELS, SUBTRACTION_LEVELS, MULTIPLICATION_LEVELS, DIVISION_LEVELS,
} from "../../levels/levelConfig.ts";
import type { LevelType } from "../../levels/levelConfig.ts";
import { MainGameProblemGenerator } from "../../problem-engine/MainGameProblemGenerator.ts";
import { ProblemDispatcher } from "../../problem-engine/ProblemDispatcher.ts";

describe("MainGameScreenModel topics", () => {
    function createDispatcher(): ProblemDispatcher {
        return new ProblemDispatcher(
            new MainGameProblemGenerator(() => 0),
            { generate: () => { throw new Error("Unexpected minigame request"); } },
        );
    }

    it("lists the 4 topics in Figma order", () => {
        const model = new MainGameScreenModel();
        expect(model.getTopics().map((t) => t.label))
            .toEqual(["Addition", "Subtraction", "Multiplication", "Division"]);
    });

    it("returns the right level for each topic", () => {
        const model = new MainGameScreenModel();
        expect(model.getLevelFor("addition")).toBe(ADDITION_LEVELS);
        expect(model.getLevelFor("subtraction")).toBe(SUBTRACTION_LEVELS);
        expect(model.getLevelFor("multiplication")).toBe(MULTIPLICATION_LEVELS);
        expect(model.getLevelFor("division")).toBe(DIVISION_LEVELS);
    });

    it("throws on an unknown topic", () => {
        const model = new MainGameScreenModel();
        expect(() => model.getLevelFor("fractions" as LevelType)).toThrow("Unknown topic");
    });

    it("remembers the selected topic", () => {
        const model = new MainGameScreenModel();
        expect(model.getSelectedTopic()).toBeNull();
        model.selectTopic("division");
        expect(model.getSelectedTopic()).toBe("division");
    });

    it("rejects selecting an unknown topic", () => {
        const model = new MainGameScreenModel();
        expect(() => model.selectTopic("fractions" as LevelType)).toThrow();
        expect(model.getSelectedTopic()).toBeNull();
    });

    it.each([
        ["addition", [1, 1], 2],
        ["subtraction", [10, 1], 9],
        ["multiplication", [1, 1], 1],
        ["division", [10, 1], 10],
    ] as const)("generates a %s problem for the selected topic", (operation, operands, answer) => {
        const model = new MainGameScreenModel();
        const dispatcher = createDispatcher();
        const generate = vi.spyOn(dispatcher, "generate");
        model.selectTopic(operation);

        expect(model.generateProblem(1, dispatcher)).toMatchObject({ operands, answer });
        expect(generate).toHaveBeenCalledExactlyOnceWith({
            gameType: "main-game", operation, difficulty: 1,
        });
    });

    it.each([
        [1, [1, 1], 2], [2, [10, 10], 20], [3, [100, 100], 200],
        [4, [100, 100, 100], 300], [5, [10000, 10000, 10000], 30000],
    ])("uses the configured addition operands at difficulty %i", (difficulty, operands, answer) => {
        const model = new MainGameScreenModel();
        model.selectTopic("addition");
        const problem = model.generateProblem(difficulty, createDispatcher());
        expect(problem.operands).toEqual(operands);
        expect(problem.answer).toBe(answer);
    });

    it("uses a newly selected topic for the next problem", () => {
        const model = new MainGameScreenModel();
        const dispatcher = createDispatcher();
        model.selectTopic("addition");
        expect(model.generateProblem(1, dispatcher).answer).toBe(2);
        model.selectTopic("subtraction");
        expect(model.generateProblem(1, dispatcher).answer).toBe(9);
    });

    it("does not call the dispatcher before topic selection", () => {
        const model = new MainGameScreenModel();
        const dispatcher = createDispatcher();
        const generate = vi.spyOn(dispatcher, "generate");
        expect(() => model.generateProblem(1, dispatcher)).toThrow("Choose a topic");
        expect(generate).not.toHaveBeenCalled();
    });

    it.each([0, -1, 1.5, NaN, 6])("rejects invalid or unconfigured difficulty %s", difficulty => {
        const model = new MainGameScreenModel();
        const dispatcher = createDispatcher();
        model.selectTopic("division");
        expect(() => model.generateProblem(difficulty, dispatcher)).toThrow();
        expect(model.getSelectedTopic()).toBe("division");
    });
});
