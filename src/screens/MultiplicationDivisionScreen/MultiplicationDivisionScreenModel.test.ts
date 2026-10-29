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
});
