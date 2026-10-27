import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_HEIGHT,STAGE_WIDTH } from "../../constants.ts";
import { createHomeButton } from "../../components/HomeButton.ts";

export class FractionSortScreenView implements View {
    private group: Konva.Group;

    constructor(onHomeClick: () => void /*, other callbacks, e.g. onStartClick: () => void */) {
        this.group = new Konva.Group({ visible: false });

        // add Konva shapes (background, game elements) to this.group here

        // Home button — added last so it's drawn on top of everything else
        this.group.add(createHomeButton(onHomeClick, STAGE_WIDTH - 50, STAGE_HEIGHT - 50));
    }

    show(): void { this.group.visible(true); this.group.getLayer()?.draw(); }
    hide(): void { this.group.visible(false); this.group.getLayer()?.draw(); }
    getGroup(): Konva.Group { return this.group; }
}