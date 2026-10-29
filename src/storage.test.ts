import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadHighScore, saveHighScore } from "./storage.ts";

const values = new Map<string, string>();

const localStorageMock = {
    getItem(key: string): string | null {
        return values.get(key) ?? null;
    },
    setItem(key: string, value: string): void {
        values.set(key, value);
    },
};

describe("mini-game high scores", () => {
    beforeEach(() => {
        values.clear();
        vi.stubGlobal("localStorage", localStorageMock);
    });

    it("loads and saves separate high scores for each game", () => {
        saveHighScore("fraction-sort", 150);
        saveHighScore("multiplication-division", 800);

        expect(loadHighScore("fraction-sort")).toBe(150);
        expect(loadHighScore("multiplication-division")).toBe(800);
    });

    it("continues using the existing Fraction Sort high-score key", () => {
        values.set("cse110-team4:fractionHighScore", "250");

        expect(loadHighScore("fraction-sort")).toBe(250);
    });

    it("returns zero when no valid positive score is saved", () => {
        values.set("cse110-team4:fractionHighScore", "not a score");

        expect(loadHighScore("fraction-sort")).toBe(0);
    });
});
