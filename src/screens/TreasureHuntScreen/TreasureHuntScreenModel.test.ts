import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAllLevelDefinitions } from "../../levels/levelConfig.ts";
import { saveProgression } from "../../storage.ts";
import { TreasureHuntScreenModel } from "./TreasureHuntScreenModel.ts";

beforeEach(() => {
    const data = new Map<string, string>();
    vi.stubGlobal("localStorage", {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => data.set(key, value),
    });
});
afterEach(() => vi.unstubAllGlobals());

describe("Treasure Hunt rewards from saved progress", () => {
    it("starts with four locked topic treasures and a locked ultimate treasure", () => {
        const data = new TreasureHuntScreenModel().getTreasureData();
        expect(data.treasures).toHaveLength(4);
        expect(data.treasures.every(treasure => !treasure.isUnlocked)).toBe(true);
        expect(data.collectedCount).toBe(0);
        expect(data.isUltimateUnlocked).toBe(false);
    });

    it("does not award treasures just for reaching the final difficulty", () => {
        getAllLevelDefinitions().forEach(level => saveProgression(level, {
            levelId: level.id, currentDifficulty: level.maxDifficulty, isActive: false, isCompleted: false,
        }));
        expect(new TreasureHuntScreenModel().getTreasureData().collectedCount).toBe(0);
    });

    it("awards each completed topic once and unlocks ultimate only after the fourth", () => {
        const model = new TreasureHuntScreenModel();
        getAllLevelDefinitions().forEach((level, index) => {
            saveProgression(level, {
                levelId: level.id, currentDifficulty: level.maxDifficulty, isActive: false, isCompleted: true,
            });
            const data = model.getTreasureData();
            expect(data.treasures.find(treasure => treasure.topic === level.type)?.isUnlocked).toBe(true);
            expect(data.collectedCount).toBe(index + 1);
            expect(data.isUltimateUnlocked).toBe(index === 3);
            expect(new TreasureHuntScreenModel().getTreasureData()).toEqual(data);
            expect(model.getTreasureData()).toEqual(data);
        });
    });

    it("counts a clue for every finished level in a locked topic", () => {
        const addition = getAllLevelDefinitions().find(level => level.type === "addition")!;
        const cluesFor = () => new TreasureHuntScreenModel().getTreasureData()
            .treasures.find(treasure => treasure.topic === "addition")!;
        expect(cluesFor()).toMatchObject({ cluesFound: 0, totalClues: 5 });
        for (let difficulty = 1; difficulty <= 4; difficulty++) {
            saveProgression(addition, {
                levelId: addition.id, currentDifficulty: difficulty, isActive: false, isCompleted: false,
            });
            expect(cluesFor()).toMatchObject({ cluesFound: difficulty - 1, isUnlocked: false });
        }
    });

    it("does not count the level that is currently being played", () => {
        const addition = getAllLevelDefinitions().find(level => level.type === "addition")!;
        saveProgression(addition, { levelId: addition.id, currentDifficulty: 3, isActive: true, isCompleted: false });
        const treasure = new TreasureHuntScreenModel().getTreasureData()
            .treasures.find(t => t.topic === "addition")!;
        expect(treasure.cluesFound).toBe(2);
    });

    it("counts all five clues once the topic is completed", () => {
        const addition = getAllLevelDefinitions().find(level => level.type === "addition")!;
        saveProgression(addition, { levelId: addition.id, currentDifficulty: 5, isActive: false, isCompleted: true });
        expect(new TreasureHuntScreenModel().getTreasureData().treasures.find(t => t.topic === "addition"))
            .toMatchObject({ cluesFound: 5, totalClues: 5, isUnlocked: true });
    });

    it("keeps corrupted progress locked", () => {
        localStorage.setItem("cse110-team4:progression:addition", "invalid");
        expect(new TreasureHuntScreenModel().getTreasureData().collectedCount).toBe(0);
    });
});
