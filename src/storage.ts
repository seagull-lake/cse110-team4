import type { Screen } from "./types.ts";

const PREFIX = "cse110-team4:";
const SCREEN_KEY = PREFIX + "currentScreen";
const FRACTION_HIGH_SCORE_KEY = PREFIX + "fractionHighScore";

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

/*------ Fraction Sort high score ------*/

export function saveFractionHighScore(score: number): void {
    try {
        localStorage.setItem(FRACTION_HIGH_SCORE_KEY, String(score));
    } catch { /* storage full or blocked – skip saving */ }
}

export function loadFractionHighScore(): number {
    try {
        const saved = Number(localStorage.getItem(FRACTION_HIGH_SCORE_KEY));
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