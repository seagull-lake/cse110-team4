import { describe, expect, it } from "vitest";
import { MainGameScreenModel } from "./MainGameScreenModel.ts";
import {
    ADDITION_LEVELS, SUBTRACTION_LEVELS, MULTIPLICATION_LEVELS, DIVISION_LEVELS,
} from "../../levels/levelConfig.ts";
import type { LevelType } from "../../levels/levelConfig.ts";
import { MainGameProblemGenerator } from "../../problem-engine/MainGameProblemGenerator.ts";
import { ProblemDispatcher } from "../../problem-engine/ProblemDispatcher.ts";

describe("MainGameScreenModel topics", () => {
    const dispatcher = new ProblemDispatcher(
        new MainGameProblemGenerator(() => 0),
        { generate: () => { throw new Error("Unexpected minigame request"); } },
    );

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

    it("generates a problem for the selected topic and difficulty", () => {
        const model = new MainGameScreenModel();
        model.selectTopic("addition");
        expect(model.generateProblem(4, dispatcher)).toMatchObject({ operands: [1, 1, 1], answer: 3 });

        model.selectTopic("multiplication");
        expect(model.generateProblem(1, dispatcher)).toMatchObject({ operands: [1, 1], answer: 1 });
    });

    it("rejects requests before topic selection or with invalid difficulty", () => {
        const model = new MainGameScreenModel();
        expect(() => model.generateProblem(1, dispatcher)).toThrow("Choose a topic");

        model.selectTopic("division");
        expect(() => model.generateProblem(0, dispatcher)).toThrow("Difficulty must be a positive integer");
        expect(() => model.generateProblem(6, dispatcher)).toThrow("Unconfigured main-game difficulty");
        expect(model.getSelectedTopic()).toBe("division");
    });
});
