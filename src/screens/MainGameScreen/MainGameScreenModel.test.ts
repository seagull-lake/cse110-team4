import { describe, expect, it } from "vitest";
import { MainGameScreenModel } from "./MainGameScreenModel.ts";
import {
    ADDITION_LEVELS, SUBTRACTION_LEVELS, MULTIPLICATION_LEVELS, DIVISION_LEVELS,
} from "../../levels/levelConfig.ts";
import type { LevelType } from "../../levels/levelConfig.ts";

describe("MainGameScreenModel topics", () => {
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
});
