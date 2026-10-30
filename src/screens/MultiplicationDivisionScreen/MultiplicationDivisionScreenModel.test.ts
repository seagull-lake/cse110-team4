import { beforeEach, describe, expect, it, vi } from "vitest";
import { MultiplicationDivisionScreenModel } from "./MultiplicationDivisionScreenModel.ts";

const values = new Map<string, string>();

const localStorageMock = {
    getItem(key: string): string | null {
        return values.get(key) ?? null;
    },
    setItem(key: string, value: string): void {
        values.set(key, value);
    },
};

describe("Multiplication and Division scoring", () => {
    beforeEach(() => {
        values.clear();
        vi.stubGlobal("localStorage", localStorageMock);
    });

    it("tracks and persists its score independently", () => {
        const model = new MultiplicationDivisionScreenModel();
        model.addPoints(100);

        expect(model.getScore()).toBe(100);
        expect(model.finishGame()).toBe(true);

        const nextGame = new MultiplicationDivisionScreenModel();
        expect(nextGame.getScore()).toBe(0);
        expect(nextGame.getHighScore()).toBe(100);
    });

    it("doubles points from the second consecutive correct answer", () => {
        const model = new MultiplicationDivisionScreenModel();

        expect(model.recordAnswer(true, 50)).toBe(50);
        expect(model.getCombo()).toBe(1);
        expect(model.recordAnswer(true, 50)).toBe(100);
        expect(model.getCombo()).toBe(2);
        expect(model.recordAnswer(true, 50)).toBe(100);
        expect(model.getScore()).toBe(250);
    });

    it("resets the combo after an incorrect answer", () => {
        const model = new MultiplicationDivisionScreenModel();
        model.recordAnswer(true, 50);
        model.recordAnswer(true, 50);

        expect(model.recordAnswer(false, 50)).toBe(0);
        expect(model.getCombo()).toBe(0);
        expect(model.recordAnswer(true, 50)).toBe(50);
    });

    it("resets the combo when the game resets", () => {
        const model = new MultiplicationDivisionScreenModel();
        model.recordAnswer(true, 50);
        model.recordAnswer(true, 50);

        model.resetGame();

        expect(model.getCombo()).toBe(0);
        expect(model.getScore()).toBe(0);
    });
});
