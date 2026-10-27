import type { Screen } from "./types.ts";

const SCREEN_KEY = "cse110-team4:currentScreen";

/** Remember which screen is open */
export function saveScreen(screen: Screen): void {
    try {
        localStorage.setItem(SCREEN_KEY, JSON.stringify(screen));
    } catch { /* storage full or blocked – skip saving */ }
}

/** Screen to open on page load (menu if nothing saved) */
export function loadScreen(): Screen {
    try {
        const saved = localStorage.getItem(SCREEN_KEY);
        if (saved) return JSON.parse(saved) as Screen;
    } catch { /* missing or corrupted data */ }
    return { type: "menu" };
}

/** Wipe all saved app data (handy for testing / a "reset" button) */
export function clearAll(): void {
    try {
        Object.keys(localStorage)
            .filter(key => key.startsWith("cse110-team4:"))
            .forEach(key => localStorage.removeItem(key));
    } catch { /* ignore */ }
}