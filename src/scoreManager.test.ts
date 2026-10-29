import { beforeEach, describe, expect, it, vi } from "vitest";
import { MiniGameScoreManager } from "./scoreManager.ts";

const values = new Map<string, string>();

const localStorageMock = {
    getItem(key: string): string | null {
        return values.get(key) ?? null;
    },
    setItem(key: string, value: string): void {
        values.set(key, value);
    },
};

describe("mini-game score manager", () => {
    beforeEach(() => {
        values.clear();
        vi.stubGlobal("localStorage", localStorageMock);
    });

    it("keeps current scores separate between games", () => {
        const fractions = new MiniGameScoreManager("fraction-sort");
        const multiplication = new MiniGameScoreManager("multiplication-division");

        fractions.addPoints(50);
        multiplication.addPoints(100);

        expect(fractions.getScore()).toBe(50);
        expect(multiplication.getScore()).toBe(100);
    });

    it("persists a new high score only for its game", () => {
        const fractions = new MiniGameScoreManager("fraction-sort");
        const multiplication = new MiniGameScoreManager("multiplication-division");
        fractions.addPoints(50);

        expect(fractions.finishGame()).toBe(true);
        expect(multiplication.getHighScore()).toBe(0);
        expect(new MiniGameScoreManager("fraction-sort").getHighScore()).toBe(50);
        expect(fractions.finishGame()).toBe(false);
    });

    it("resets the current score without clearing the high score", () => {
        const scores = new MiniGameScoreManager("multiplication-division");
        scores.addPoints(100);
        scores.finishGame();

        scores.reset();

        expect(scores.getScore()).toBe(0);
        expect(scores.getHighScore()).toBe(100);
    });
});
