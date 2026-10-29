import Konva from "konva";
import type { View } from "../../types.ts";
import {
    STAGE_HEIGHT, STAGE_WIDTH, FONT_FAMILY, TITLE_COLOR, BUTTON_COLOR, BUTTON_TEXT_COLOR,
} from "../../constants.ts";


export class MenuScreenView implements View {
    private group: Konva.Group;

    constructor(
        onMainGameClick: () => void,
        onMultiDivGameClick: () => void,
        onFractionGameClick: () => void,
    ) {
        this.group = new Konva.Group({ visible: false });

        this.group.add(new Konva.Text({
            x: 0, y: STAGE_HEIGHT/2-200, width: STAGE_WIDTH, align: "center", text: "Math Quest",
            fontSize: 50, fontFamily: FONT_FAMILY, fill: TITLE_COLOR,
        }));
        this.group.add(this.makeButton("Start", 200, onMainGameClick));
        this.group.add(this.makeButton("Mini Game #1", 300, onMultiDivGameClick));
        this.group.add(this.makeButton("Mini Game #2", 400, onFractionGameClick));
    }

    // Helper so you don't repeat the Rect + Text code three times
    private makeButton(label: string, y: number, onClick: () => void): Konva.Group {
        const button = new Konva.Group({ x: STAGE_WIDTH / 2 - 120, y });
        button.add(new Konva.Rect({ width: 240, height: 60, fill: BUTTON_COLOR, cornerRadius: 25 }));
        button.add(new Konva.Text({
            width: 240, height: 60, text: label, fontSize: 22, fontFamily: FONT_FAMILY,
            fill: BUTTON_TEXT_COLOR, align: "center", verticalAlign: "middle",
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