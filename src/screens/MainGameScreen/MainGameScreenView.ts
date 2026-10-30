import Konva from "konva";
import type { View } from "../../types.ts";
import type { LevelType } from "../../levels/levelConfig.ts";
import type { Topic } from "./MainGameScreenModel.ts";
import {
    STAGE_HEIGHT, STAGE_WIDTH, FONT_FAMILY, TITLE_COLOR, BUTTON_COLOR, BUTTON_TEXT_COLOR,
} from "../../constants.ts";

const BUTTON_WIDTH = 260;
const BUTTON_HEIGHT = 64;
const GAP = 30;
const HOME_COLOR = "#F2C94C";

export class MainGameScreenView implements View {
    private group: Konva.Group;

    constructor(topics: readonly Topic[], onTopicClick: (topic: LevelType) => void, onHomeClick: () => void) {
        this.group = new Konva.Group({ visible: false });

        this.group.add(new Konva.Text({
            x: 0, y: 90, width: STAGE_WIDTH, align: "center", text: "Choose Your Adventure",
            fontSize: 50, fontFamily: FONT_FAMILY, fill: TITLE_COLOR,
        }));

        // 2-column grid, built from the topic list so new topics need no View changes
        const gridLeft = STAGE_WIDTH / 2 - BUTTON_WIDTH - GAP / 2;
        topics.forEach((topic, i) => {
            const x = gridLeft + (i % 2) * (BUTTON_WIDTH + GAP);
            const y = 220 + Math.floor(i / 2) * (BUTTON_HEIGHT + GAP);
            this.group.add(this.makeButton(topic.label, x, y, BUTTON_COLOR, BUTTON_TEXT_COLOR,
                () => onTopicClick(topic.level.type)));
        });

        this.group.add(this.makeButton("Home", 30, STAGE_HEIGHT - 30 - BUTTON_HEIGHT, HOME_COLOR, TITLE_COLOR,
            onHomeClick, 140));
    }

    private makeButton(label: string, x: number, y: number, fill: string, textColor: string,
                       onClick: () => void, width = BUTTON_WIDTH): Konva.Group {
        const button = new Konva.Group({ x, y });
        button.add(new Konva.Rect({ width, height: BUTTON_HEIGHT, fill, cornerRadius: 25 }));
        button.add(new Konva.Text({
            width, height: BUTTON_HEIGHT, text: label, fontSize: 25, fontFamily: FONT_FAMILY,
            fill: textColor, align: "center", verticalAlign: "middle",
        }));
        button.on("click", onClick);
        button.on("mouseenter", () => (document.body.style.cursor = "pointer"));
        button.on("mouseleave", () => (document.body.style.cursor = "default"));
        return button;
    }

    show(): void { this.group.visible(true); this.group.getLayer()?.draw(); }
    hide(): void { this.group.visible(false); this.group.getLayer()?.draw(); }
    getGroup(): Konva.Group { return this.group; }
}
