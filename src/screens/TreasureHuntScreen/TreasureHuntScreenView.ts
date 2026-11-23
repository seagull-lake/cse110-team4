import Konva from "konva";
import type { View } from "../../types.ts";
import type { LevelType } from "../../levels/levelConfig.ts";
import type { TreasureHuntData } from "./TreasureHuntScreenModel.ts";
import { createHomeButton } from "../../components/ComponentFactory.ts";
import { BUTTON_COLOR, FONT_FAMILY, STAGE_WIDTH, TITLE_COLOR } from "../../constants.ts";

export class TreasureHuntScreenView implements View {
    private readonly group = new Konva.Group({ visible: false });
    private readonly rewards = new Konva.Group();
    private readonly onTopicClick: (topic: LevelType) => void;

    constructor(onHomeClick: () => void, onTopicClick: (topic: LevelType) => void) {
        this.onTopicClick = onTopicClick;
        this.group.add(this.text("Treasure Hunt", 45, 44));
        this.group.add(this.text("Complete each topic to collect its treasure!", 105, 23));
        this.group.add(this.rewards);
        this.group.add(createHomeButton(onHomeClick));
    }

    setTreasureData(data: TreasureHuntData): void {
        this.rewards.destroyChildren();
        this.rewards.add(this.text(`${data.collectedCount} / ${data.treasures.length} treasures collected`, 145, 22));
        data.treasures.forEach((treasure, index) => {
            const card = new Konva.Group({ x: 90 + (index % 2) * 320, y: 195 + Math.floor(index / 2) * 110 });
            card.add(new Konva.Rect({
                width: 300, height: 95, cornerRadius: 16,
                fill: treasure.isUnlocked ? "#FFF0B3" : "#ECEDE8",
                stroke: treasure.isUnlocked ? "#B8860B" : "#B6BAAD", strokeWidth: 2,
            }));
            card.add(new Konva.Text({
                width: 300, y: 15, text: `${treasure.label} Treasure`, align: "center",
                fontSize: 24, fontFamily: FONT_FAMILY, fill: TITLE_COLOR,
            }));
            card.add(new Konva.Text({
                width: 300, y: 52, text: treasure.isUnlocked ? "Collected!" : `Locked - ${treasure.cluesFound}/${treasure.totalClues} clues found`,
                align: "center", fontSize: 19, fontFamily: FONT_FAMILY, fill: BUTTON_COLOR,
            }));
            card.on("click tap", () => this.onTopicClick(treasure.topic));
            card.on("mouseenter", () => (document.body.style.cursor = "pointer"));
            card.on("mouseleave", () => (document.body.style.cursor = "default"));
            this.rewards.add(card);
        });
        this.rewards.add(this.text(
            data.isUltimateUnlocked ? "Ultimate Treasure - Collected!" : "Ultimate Treasure - Locked",
            435, 30,
        ));
        this.rewards.add(this.text(
            data.isUltimateUnlocked ? "You completed all four topics. The ultimate treasure is yours!" : "Collect all four topic treasures to unlock the ultimate treasure.",
            480, 20,
        ));
        this.group.getLayer()?.batchDraw();
    }

    private text(text: string, y: number, fontSize: number): Konva.Text {
        return new Konva.Text({ x: 0, y, width: STAGE_WIDTH, text, align: "center", fontSize, fontFamily: FONT_FAMILY, fill: TITLE_COLOR });
    }

    show(): void { this.group.visible(true); this.group.getLayer()?.draw(); }
    hide(): void { this.group.visible(false); this.group.getLayer()?.draw(); }
    getGroup(): Konva.Group { return this.group; }
}
