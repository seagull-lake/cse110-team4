import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Konva from "konva";
import { getAllLevelDefinitions } from "../../levels/levelConfig.ts";
import { treasureCluesByTopic } from "../../levels/treasureConfig.ts";
import { TreasureRewardScreenController } from "./TreasureRewardScreenController.ts";
import { TreasureRewardScreenModel } from "./TreasureRewardScreenModel.ts";

let controller: TreasureRewardScreenController;
const switchToScreen = vi.fn();
const expectedTreasures = {
    addition: { kind: "abacus", name: "Abacus" },
    subtraction: { kind: "pencil", name: "Pencil" },
    multiplication: { kind: "calculator", name: "Calculator" },
    division: { kind: "scale", name: "Scale" },
} as const;

beforeEach(() => {
    vi.spyOn(Konva.Util, "createCanvasElement").mockReturnValue({
        getContext: () => ({ save() {}, restore() {}, measureText: (text: string) => ({ width: text.length * 10 }) }),
    } as unknown as HTMLCanvasElement);
    controller = new TreasureRewardScreenController({ switchToScreen });
    controller.show();
});

afterEach(() => {
    controller.getView().getGroup().destroy();
    vi.restoreAllMocks();
    switchToScreen.mockClear();
});

function labels(): string[] {
    return controller.getView().getGroup().find<Konva.Text>("Text")
        .filter(node => node.isVisible()).map(node => node.text());
}

function clickContinue(): void {
    const button = controller.getView().getGroup().find<Konva.Text>("Text")
        .find(node => node.text() === "Continue");
    if (!button) throw new Error("Continue button is missing.");
    button.getParent()?.fire("click");
}

describe.each(getAllLevelDefinitions())("$type treasure clues", level => {
    it.each([
        [1, "Numbers"], [2, "Keypad"], [3, "Operations"], [4, "Equals"],
    ] as const)("shows the level %s clue and returns to its topic map", (difficulty, clue) => {
        controller.setReward(level.type, difficulty);
        expect(labels()).toContain(clue);
        expect(labels()).toContain("for the Golden Treasure");
        expect(labels()).not.toContain("You found a\nClue for the\nGolden Treasure");
        expect(labels().filter(label => label === "✓")).toHaveLength(difficulty);
        clickContinue();
        expect(switchToScreen).toHaveBeenCalledExactlyOnceWith({ type: "adventuremap", topic: level.type });
    });

    it("reveals its own treasure at level five without showing a clue", () => {
        controller.setReward(level.type, 5);
        const treasure = expectedTreasures[level.type];
        expect(labels()).toContain("Treasure Found");
        expect(labels()).toContain(`The Golden\n${treasure.name}`);
        expect(labels()).toContain(`You found the\ntreasure!\nA Golden\n${treasure.name}!`);
        expect(labels()).not.toContain("You found a clue:");
        const page = new TreasureRewardScreenModel(level.type, 5).getCurrentPage();
        expect(page).toMatchObject({ type: "treasure", treasure });
        expect(page).not.toHaveProperty("clue");
        expect(controller.getView().getGroup().find("Image")).toHaveLength(0);
        clickContinue();
        expect(switchToScreen).toHaveBeenCalledExactlyOnceWith({ type: "adventuremap", topic: level.type });
    });
});

it("uses the selected topic's configuration when its strings change", () => {
    const original = treasureCluesByTopic.subtraction;
    try {
        treasureCluesByTopic.subtraction = ["Borrow", "Difference", "Minus", "Subtract"];
        controller.setReward("subtraction", 1);
        expect(labels()).toContain("Borrow");
        expect(labels()).not.toContain("Numbers");
        controller.setReward("addition", 1);
        expect(labels()).toContain("Numbers");
        expect(labels()).not.toContain("Borrow");
    } finally {
        treasureCluesByTopic.subtraction = original;
    }
});

it.each(getAllLevelDefinitions())("shows the ultimate treasure after the final $type reward", level => {
    controller.setReward(level.type, 4);
    expect(labels()).toContain("Equals");
    controller.setReward(level.type, 5, true);
    expect(labels()).toContain("Treasure Found");
    expect(labels()).toContain(`The Golden\n${expectedTreasures[level.type].name}`);
    expect(labels()).not.toContain("Equals");
    clickContinue();
    expect(labels()).toContain("Ultimate Treasure Found");
    expect(labels()).not.toContain("You found a clue:");
    expect(switchToScreen).not.toHaveBeenCalled();
    clickContinue();
    expect(switchToScreen).toHaveBeenCalledExactlyOnceWith({ type: "maingame" });
});
