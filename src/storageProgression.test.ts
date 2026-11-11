import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ADDITION_LEVELS, DIVISION_LEVELS, MULTIPLICATION_LEVELS, SUBTRACTION_LEVELS, getAllLevelDefinitions,
} from "./levels/levelConfig.ts";
import type { LevelDefinition } from "./levels/levelConfig.ts";
import { initialProgression } from "./levels/progression.ts";
import type { ProgressionState } from "./levels/progression.ts";
import { areAllTopicsCompleted, clearAll, loadProgression, saveProgression } from "./storage.ts";

/** Behaves like the browser's localStorage: stored keys are enumerable, the methods are not. */
function makeStorage(): Record<string, string> {
    const data: Record<string, string> = {};
    const methods = {
        getItem: (key: string) => (Object.hasOwn(data, key) ? data[key] : null),
        setItem: (key: string, value: string) => { data[key] = String(value); },
        removeItem: (key: string) => { delete data[key]; },
    };
    for (const [name, method] of Object.entries(methods)) {
        Object.defineProperty(data, name, { value: method, enumerable: false });
    }
    return data;
}

const state = (level: LevelDefinition, currentDifficulty: number, isCompleted = false, isActive = false): ProgressionState =>
    ({ levelId: level.id, currentDifficulty, isActive, isCompleted });

const keyFor = (level: LevelDefinition) => `cse110-team4:progression:${level.id}`;

let storage: Record<string, string>;

beforeEach(() => {
    storage = makeStorage();
    vi.stubGlobal("localStorage", storage);
});

describe("saving and loading progression", () => {
    it("starts every topic at the beginning when nothing is saved", () => {
        for (const level of getAllLevelDefinitions()) {
            expect(loadProgression(level)).toEqual(initialProgression(level));
        }
    });

    it("loads back what was saved, separately for each topic", () => {
        saveProgression(ADDITION_LEVELS, state(ADDITION_LEVELS, 3));
        saveProgression(SUBTRACTION_LEVELS, state(SUBTRACTION_LEVELS, 5, true));
        saveProgression(DIVISION_LEVELS, state(DIVISION_LEVELS, 2));

        expect(loadProgression(ADDITION_LEVELS)).toEqual(state(ADDITION_LEVELS, 3));
        expect(loadProgression(SUBTRACTION_LEVELS)).toEqual(state(SUBTRACTION_LEVELS, 5, true));
        expect(loadProgression(DIVISION_LEVELS)).toEqual(state(DIVISION_LEVELS, 2));
        expect(loadProgression(MULTIPLICATION_LEVELS)).toEqual(initialProgression(MULTIPLICATION_LEVELS));
    });

    it("round-trips every possible state of every topic", () => {
        for (const level of getAllLevelDefinitions()) {
            for (let difficulty = 1; difficulty <= level.maxDifficulty; difficulty++) {
                saveProgression(level, state(level, difficulty));
                expect(loadProgression(level)).toEqual(state(level, difficulty));
            }
            saveProgression(level, state(level, level.maxDifficulty, true));
            expect(loadProgression(level)).toEqual(state(level, level.maxDifficulty, true));
        }
    });

    it("stores only the current difficulty and whether the topic is completed", () => {
        saveProgression(ADDITION_LEVELS, state(ADDITION_LEVELS, 3, false, true));
        expect(Object.keys(storage)).toEqual([keyFor(ADDITION_LEVELS)]);
        expect(JSON.parse(storage[keyFor(ADDITION_LEVELS)])).toEqual({ currentDifficulty: 3, isCompleted: false });
    });

    it("never loads a level as already in progress", () => {
        saveProgression(ADDITION_LEVELS, state(ADDITION_LEVELS, 4, false, true));
        expect(loadProgression(ADDITION_LEVELS).isActive).toBe(false);
    });

    it("overwrites the earlier save of the same topic", () => {
        saveProgression(ADDITION_LEVELS, state(ADDITION_LEVELS, 2));
        saveProgression(ADDITION_LEVELS, state(ADDITION_LEVELS, 3));
        expect(loadProgression(ADDITION_LEVELS).currentDifficulty).toBe(3);
        expect(Object.keys(storage)).toHaveLength(1);
    });
});

describe("unusable saved data", () => {
    it.each([
        ["not JSON", "not json"],
        ["JSON null", "null"],
        ["an array", "[]"],
        ["a number", "42"],
        ["a string", "\"3\""],
        ["an empty object", "{}"],
        ["a missing isCompleted", "{\"currentDifficulty\":3}"],
        ["a missing currentDifficulty", "{\"isCompleted\":false}"],
        ["a difficulty stored as text", "{\"currentDifficulty\":\"3\",\"isCompleted\":false}"],
        ["isCompleted stored as text", "{\"currentDifficulty\":5,\"isCompleted\":\"true\"}"],
        ["difficulty 0", "{\"currentDifficulty\":0,\"isCompleted\":false}"],
        ["a negative difficulty", "{\"currentDifficulty\":-2,\"isCompleted\":false}"],
        ["a difficulty above the maximum", "{\"currentDifficulty\":6,\"isCompleted\":false}"],
        ["a fractional difficulty", "{\"currentDifficulty\":2.5,\"isCompleted\":false}"],
        ["completed before the last difficulty", "{\"currentDifficulty\":3,\"isCompleted\":true}"],
        ["an empty string", ""],
    ])("starts at the beginning for %s", (_name, saved) => {
        storage[keyFor(ADDITION_LEVELS)] = saved;
        expect(loadProgression(ADDITION_LEVELS)).toEqual(initialProgression(ADDITION_LEVELS));
    });

    it("ignores extra fields in saved data", () => {
        storage[keyFor(ADDITION_LEVELS)] = "{\"currentDifficulty\":4,\"isCompleted\":false,\"isActive\":true,\"x\":1}";
        expect(loadProgression(ADDITION_LEVELS)).toEqual(state(ADDITION_LEVELS, 4));
    });

    it("checks the save against the level's own maximum difficulty", () => {
        saveProgression(ADDITION_LEVELS, state(ADDITION_LEVELS, 4));
        const shorterLevel = { ...ADDITION_LEVELS, maxDifficulty: 3 };
        expect(loadProgression(shorterLevel)).toEqual(initialProgression(shorterLevel));
    });

    it("doesn't let an inconsistent state overwrite good saved data", () => {
        saveProgression(ADDITION_LEVELS, state(ADDITION_LEVELS, 3));
        saveProgression(ADDITION_LEVELS, state(ADDITION_LEVELS, 9));
        saveProgression(ADDITION_LEVELS, state(ADDITION_LEVELS, 2, true));
        saveProgression(ADDITION_LEVELS, state(SUBTRACTION_LEVELS, 2));
        expect(loadProgression(ADDITION_LEVELS)).toEqual(state(ADDITION_LEVELS, 3));
    });

    it("doesn't crash when storage is blocked", () => {
        const blocked = {
            getItem: () => { throw new Error("blocked"); },
            setItem: () => { throw new Error("blocked"); },
        };
        vi.stubGlobal("localStorage", blocked);
        expect(() => saveProgression(ADDITION_LEVELS, state(ADDITION_LEVELS, 3))).not.toThrow();
        expect(loadProgression(ADDITION_LEVELS)).toEqual(initialProgression(ADDITION_LEVELS));
        expect(areAllTopicsCompleted()).toBe(false);
    });
});

describe("all topics completed", () => {
    const finishTopic = (level: LevelDefinition) => saveProgression(level, state(level, level.maxDifficulty, true));

    it("is false when nothing has been saved", () => {
        expect(areAllTopicsCompleted()).toBe(false);
    });

    it("is false until every topic is completed", () => {
        const levels = getAllLevelDefinitions();
        levels.slice(0, -1).forEach(finishTopic);
        expect(areAllTopicsCompleted()).toBe(false);
        finishTopic(levels[levels.length - 1]);
        expect(areAllTopicsCompleted()).toBe(true);
    });

    it("is false when topics are only on their last level, not finished", () => {
        for (const level of getAllLevelDefinitions()) saveProgression(level, state(level, level.maxDifficulty));
        expect(areAllTopicsCompleted()).toBe(false);
    });

    it("goes back to false if one topic is reset", () => {
        getAllLevelDefinitions().forEach(finishTopic);
        expect(areAllTopicsCompleted()).toBe(true);
        saveProgression(DIVISION_LEVELS, state(DIVISION_LEVELS, 1));
        expect(areAllTopicsCompleted()).toBe(false);
    });

    it("treats a corrupted topic as not completed", () => {
        getAllLevelDefinitions().forEach(finishTopic);
        storage[keyFor(MULTIPLICATION_LEVELS)] = "garbage";
        expect(areAllTopicsCompleted()).toBe(false);
    });

    it("is worked out from the topics, so nothing extra is stored", () => {
        getAllLevelDefinitions().forEach(finishTopic);
        areAllTopicsCompleted();
        expect(Object.keys(storage).sort()).toEqual(getAllLevelDefinitions().map(keyFor).sort());
    });
});

describe("reset", () => {
    it("clearAll also removes saved progression", () => {
        getAllLevelDefinitions().forEach(level => saveProgression(level, state(level, 2)));
        storage["other-app:key"] = "keep";
        clearAll();
        expect(Object.keys(storage)).toEqual(["other-app:key"]);
        expect(loadProgression(ADDITION_LEVELS)).toEqual(initialProgression(ADDITION_LEVELS));
    });
});
