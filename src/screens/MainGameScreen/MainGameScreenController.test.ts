import { describe, expect, it, vi } from "vitest";
import type { LevelType } from "../../levels/levelConfig.ts";
import type { Screen } from "../../types.ts";
import { MainGameScreenController } from "./MainGameScreenController.ts";

// Konva can't draw text in tests, so the view is replaced with one that keeps its click handlers
const view = vi.hoisted(() => ({
    onTopicClick: (_topic: LevelType) => {},
    onHomeClick: () => {},
}));

vi.mock("./MainGameScreenView.ts", () => ({
    MainGameScreenView: class {
        constructor(_topics: unknown, onTopicClick: (topic: LevelType) => void, onHomeClick: () => void) {
            view.onTopicClick = onTopicClick;
            view.onHomeClick = onHomeClick;
        }
    },
}));

function setup() {
    const screens: Screen[] = [];
    new MainGameScreenController({ switchToScreen: (screen) => screens.push(screen) });
    return screens;
}

describe("MainGameScreenController topic selection", () => {
    it.each(["addition", "subtraction", "multiplication", "division"] as const)(
        "opens the %s adventure map", (topic) => {
            const screens = setup();
            view.onTopicClick(topic);
            expect(screens).toEqual([{ type: "adventuremap", topic }]);
        });

    it("goes back to the menu on Home", () => {
        const screens = setup();
        view.onHomeClick();
        expect(screens).toEqual([{ type: "menu" }]);
    });
});
