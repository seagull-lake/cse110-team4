import type { Screen } from "./types.ts";
import { getAllLevelDefinitions } from "./levels/levelConfig.ts";
import type { LevelDefinition } from "./levels/levelConfig.ts";
import { initialProgression, isValidProgression } from "./levels/progression.ts";
import type { ProgressionState } from "./levels/progression.ts";

const PREFIX = "cse110-team4:";
const SCREEN_KEY = PREFIX + "currentScreen";

export type MiniGameId = "fraction-sort" | "multiplication-division";

const HIGH_SCORE_KEYS: Record<MiniGameId, string> = {
    "fraction-sort": PREFIX + "fractionHighScore",
    "multiplication-division": PREFIX + "multiplicationDivisionHighScore",
};

/*------ Current screen ------*/

export function saveScreen(screen: Screen): void {
    try {
        localStorage.setItem(SCREEN_KEY, JSON.stringify(screen));
    } catch { /* storage full or blocked – skip saving */ }
}

export function loadScreen(): Screen {
    try {
        const saved = localStorage.getItem(SCREEN_KEY);
        if (saved) return JSON.parse(saved) as Screen;
    } catch { /* missing or corrupted data */ }
    return { type: "menu" };
}

/*------ Mini-game high scores ------*/

export function saveHighScore(gameId: MiniGameId, score: number): void {
    try {
        //does it get erased when new highscore added?
        localStorage.setItem(HIGH_SCORE_KEYS[gameId], String(score));
    } catch { /* storage full or blocked – skip saving */ }
}

export function loadHighScore(gameId: MiniGameId): number {
    try {
        const saved = Number(localStorage.getItem(HIGH_SCORE_KEYS[gameId]));
        if (Number.isFinite(saved) && saved > 0) return saved;
    } catch { /* missing data, or no localStorage (e.g. in tests) */ }
    return 0;
}

/*------ Level progression (one entry per topic) ------*/

const progressionKey = (level: LevelDefinition) => `${PREFIX}progression:${level.id}`;

/**
 * Saves how far the player got in one topic. Only currentDifficulty and isCompleted are kept
 * (isActive is temporary); completed and locked levels are worked out from them.
 * An inconsistent state is ignored so it can't overwrite good saved data.
 */
export function saveProgression(level: LevelDefinition, state: ProgressionState): void {
    if (!isValidProgression(level, state)) return;
    try {
        localStorage.setItem(progressionKey(level), JSON.stringify({
            currentDifficulty: state.currentDifficulty,
            isCompleted: state.isCompleted,
        }));
    } catch { /* storage full or blocked – skip saving */ }
}

/** Loads a topic's saved progress; missing, corrupted or inconsistent data starts at the beginning. */
export function loadProgression(level: LevelDefinition): ProgressionState {
    try {
        const saved: unknown = JSON.parse(localStorage.getItem(progressionKey(level)) ?? "null");
        if (typeof saved === "object" && saved !== null) {
            const { currentDifficulty, isCompleted } = saved as Record<string, unknown>;
            if (typeof currentDifficulty === "number" && typeof isCompleted === "boolean") {
                const state: ProgressionState = {
                    currentDifficulty, isActive: false, isCompleted, levelId: level.id,
                };
                if (isValidProgression(level, state)) return state;
            }
        }
    } catch { /* missing or corrupted data, or no localStorage (e.g. in tests) */ }
    return initialProgression(level);
}

/** True only when every topic is finished. Worked out from each topic's save, never stored itself. */
export function areAllTopicsCompleted(): boolean {
    return getAllLevelDefinitions().every(level => loadProgression(level).isCompleted);
}

/*------ Reset ------*/

export function clearAll(): void {
    try {
        Object.keys(localStorage)
            .filter(key => key.startsWith(PREFIX))
            .forEach(key => localStorage.removeItem(key));
    } catch { /* ignore */ }
}