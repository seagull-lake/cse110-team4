import { describe, expect, it, vi } from "vitest";
import type { LevelType } from "../../levels/levelConfig.ts";
import { TreasureHuntScreenController } from "./TreasureHuntScreenController.ts";

const view = vi.hoisted(() => ({
    onHome: () => {}, onTopic: (_topic: LevelType) => {},
    setTreasureData: vi.fn(), show: vi.fn(),
}));
const progress = vi.hoisted(() => ({ completed: false }));
vi.mock("../../storage.ts", () => ({ loadProgression: () => ({ isCompleted: progress.completed }) }));
vi.mock("./TreasureHuntScreenView.ts", () => ({
    TreasureHuntScreenView: class {
        constructor(onHome: () => void, onTopic: (topic: LevelType) => void) {
            view.onHome = onHome;
            view.onTopic = onTopic;
        }
        setTreasureData = view.setTreasureData;
        show = view.show;
    },
}));

describe("Treasure Hunt navigation and refresh", () => {
    it("refreshes rewards when reopened after completing topics", () => {
        const controller = new TreasureHuntScreenController({ switchToScreen: vi.fn() });
        progress.completed = false;
        controller.show();
        expect(view.setTreasureData).toHaveBeenLastCalledWith(expect.objectContaining({ collectedCount: 0, isUltimateUnlocked: false }));
        progress.completed = true;
        controller.show();
        expect(view.setTreasureData).toHaveBeenLastCalledWith(expect.objectContaining({ collectedCount: 4, isUltimateUnlocked: true }));
        expect(view.show).toHaveBeenCalledTimes(2);
    });

    it("returns home and opens a treasure's topic map", () => {
        const switchToScreen = vi.fn();
        new TreasureHuntScreenController({ switchToScreen });
        view.onHome();
        expect(switchToScreen).toHaveBeenLastCalledWith({ type: "menu" });
        view.onTopic("division");
        expect(switchToScreen).toHaveBeenLastCalledWith({ type: "adventuremap", topic: "division" });
    });
});
