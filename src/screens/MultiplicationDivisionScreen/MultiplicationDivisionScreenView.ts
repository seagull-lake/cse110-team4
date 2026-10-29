import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_WIDTH } from "../../constants.ts";
import { createHomeButton } from "../../components/HomeButton.ts";

export class MultiplicationDivisionScreenView implements View {
    private group: Konva.Group;
    private scoreText: Konva.Text;

    constructor(onHomeClick: () => void /*, other callbacks, e.g. onStartClick: () => void */) {
        this.group = new Konva.Group({ visible: false });

        // add Konva shapes (background, game elements) to this.group here
        this.scoreText = new Konva.Text({
            x: 0,
            y: 20,
            width: STAGE_WIDTH - 30,
            text: "Points: 0",
            fontSize: 20,
            fontFamily: "Arial",
            fill: "#3b2f0b",
            align: "right",
        });
        this.group.add(this.scoreText);

        // Home button — added last so it's drawn on top of everything else
        this.group.add(createHomeButton(onHomeClick));
    }

    updateScore(score: number): void {
        this.scoreText.text(`Points: ${score}`);
        this.group.getLayer()?.draw();
    }

    show(): void { this.group.visible(true); this.group.getLayer()?.draw(); }
    hide(): void { this.group.visible(false); this.group.getLayer()?.draw(); }
    getGroup(): Konva.Group { return this.group; }
}