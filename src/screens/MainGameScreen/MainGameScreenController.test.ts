import { describe, expect, it, vi } from "vitest";
import type { LevelType } from "../../levels/levelConfig.ts";
import type { Screen } from "../../types.ts";
import { MainGameScreenController } from "./MainGameScreenController.ts";

// Konva can't draw text in tests, so the view is replaced with one that keeps its click handlers
const view = vi.hoisted(() => ({
    onTopicClick: (_topic: LevelType) => {},
    onHomeClick: () => {},
    completedTopics: null as ReadonlySet<LevelType> | null,
    shown: false,
}));

vi.mock("./MainGameScreenView.ts", () => ({
    MainGameScreenView: class {
        constructor(_topics: unknown, onTopicClick: (topic: LevelType) => void, onHomeClick: () => void) {
            view.onTopicClick = onTopicClick;
            view.onHomeClick = onHomeClick;
        }
        setCompletedTopics(completed: ReadonlySet<LevelType>) { view.completedTopics = completed; }
        show() { view.shown = true; }
    },
}));

function setup() {
    const screens: Screen[] = [];
    const controller = new MainGameScreenController({ switchToScreen: (screen) => screens.push(screen) });
    return { screens, controller };
}

describe("MainGameScreenController topic selection", () => {
    it.each(["addition", "subtraction", "multiplication", "division"] as const)(
        "opens the %s adventure map", (topic) => {
            const { screens } = setup();
            view.onTopicClick(topic);
            expect(screens).toEqual([{ type: "adventuremap", topic }]);
        });

    it("goes back to the menu on Home", () => {
        const { screens } = setup();
        view.onHomeClick();
        expect(screens).toEqual([{ type: "menu" }]);
    });
});

describe("MainGameScreenController golden topics", () => {
    it("passes the completed topics to the view when shown", () => {
        const { controller } = setup();
        controller.show();
        expect(view.completedTopics).toBeInstanceOf(Set);
        expect(view.shown).toBe(true);
    });
});
