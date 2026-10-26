import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_WIDTH } from "../../constants.ts";

export class MenuScreenView implements View {
    private group: Konva.Group;

    constructor(
        onMainGameClick: () => void,
        onMultiDivGameClick: () => void,
        onFractionGameClick: () => void,
    ) {
        this.group = new Konva.Group({ visible: false });

        this.group.add(this.makeButton("Main Game", 200, onMainGameClick));
        this.group.add(this.makeButton("Multiply / Divide", 300, onMultiDivGameClick));
        this.group.add(this.makeButton("Fractions", 400, onFractionGameClick));
    }

    // Helper so you don't repeat the Rect + Text code three times
    private makeButton(label: string, y: number, onClick: () => void): Konva.Group {
        const button = new Konva.Group({ x: STAGE_WIDTH / 2 - 120, y });
        button.add(new Konva.Rect({ width: 240, height: 60, fill: "green", cornerRadius: 10 }));
        button.add(new Konva.Text({
            width: 240, height: 60, text: label, fontSize: 22,
            fill: "white", align: "center", verticalAlign: "middle",
        }));
        button.on("click", onClick);
        return button;
    }

    show(): void { this.group.visible(true); this.group.getLayer()?.draw(); }
    hide(): void { this.group.visible(false); this.group.getLayer()?.draw(); }
    getGroup(): Konva.Group { return this.group; }
}