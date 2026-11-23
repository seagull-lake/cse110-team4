import Konva from "konva";
import type { View } from "../../types.ts";
import type { LevelType } from "../../levels/levelConfig.ts";
import type { Topic } from "./MainGameScreenModel.ts";
import { createHomeButton } from "../../components/ComponentFactory.ts";
import {
    STAGE_WIDTH, FONT_FAMILY, TITLE_COLOR, BUTTON_COLOR, BUTTON_TEXT_COLOR,
} from "../../constants.ts";

const BUTTON_WIDTH = 260;
const BUTTON_HEIGHT = 64;
const GAP = 30;

// Completed topics turn golden (Figma "Choose a Topic" screen)
const GOLD_BUTTON_COLOR = "#F5D75E";

export class MainGameScreenView implements View {
    private group: Konva.Group;
    private readonly buttonBackgrounds = new Map<LevelType, Konva.Rect>();

    constructor(topics: readonly Topic[], onTopicClick: (topic: LevelType) => void, onHomeClick: () => void) {
        this.group = new Konva.Group({ visible: false });

        this.group.add(new Konva.Text({
            x: 0, y: 90, width: STAGE_WIDTH, align: "center", text: "Please Select a Topic",
            fontSize: 50, fontFamily: FONT_FAMILY, fill: TITLE_COLOR,
        }));

        // 2-column grid, built from the topic list so new topics need no View changes
        const gridLeft = STAGE_WIDTH / 2 - BUTTON_WIDTH - GAP / 2;
        topics.forEach((topic, i) => {
            const x = gridLeft + (i % 2) * (BUTTON_WIDTH + GAP);
            const y = 220 + Math.floor(i / 2) * (BUTTON_HEIGHT + GAP);
            this.group.add(this.makeButton(topic.level.type, topic.label, x, y, () => onTopicClick(topic.level.type)));
        });

        // Shared Home button, same as every other screen
        this.group.add(createHomeButton(onHomeClick));
    }

    /** Colors each topic button golden if its topic is completed, and the normal green otherwise. */
    setCompletedTopics(completed: ReadonlySet<LevelType>): void {
        this.buttonBackgrounds.forEach((background, topic) => {
            background.fill(completed.has(topic) ? GOLD_BUTTON_COLOR : BUTTON_COLOR);
        });
        this.group.getLayer()?.batchDraw();
    }

    private makeButton(topic: LevelType, text: string, x: number, y: number, onClick: () => void): Konva.Group {
        const button = new Konva.Group({ x, y });
        const background = new Konva.Rect({ width: BUTTON_WIDTH, height: BUTTON_HEIGHT, fill: BUTTON_COLOR, cornerRadius: 25 });
        const label = new Konva.Text({
            width: BUTTON_WIDTH, height: BUTTON_HEIGHT, text, fontSize: 25, fontFamily: FONT_FAMILY,
            fill: BUTTON_TEXT_COLOR, align: "center", verticalAlign: "middle",
        });
        button.add(background, label);
        this.buttonBackgrounds.set(topic, background);
        button.on("click", onClick);
        button.on("mouseenter", () => (document.body.style.cursor = "pointer"));
        button.on("mouseleave", () => (document.body.style.cursor = "default"));
        return button;
    }

    show(): void { this.group.visible(true); this.group.getLayer()?.draw(); }
    hide(): void { this.group.visible(false); this.group.getLayer()?.draw(); }
    getGroup(): Konva.Group { return this.group; }
}
