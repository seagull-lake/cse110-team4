import type { Screen } from "./types.ts";

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

/*------ Reset ------*/

export function clearAll(): void {
    try {
        Object.keys(localStorage)
            .filter(key => key.startsWith(PREFIX))
            .forEach(key => localStorage.removeItem(key));
    } catch { /* ignore */ }
}