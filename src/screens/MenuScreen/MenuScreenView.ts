import Konva from "konva";
import type { View } from "../../types.ts";

export class MenuScreenView implements View {
    private group: Konva.Group;

    constructor(/* callbacks, e.g. onStartClick: () => void */) {
        this.group = new Konva.Group({ visible: false });
        // add Konva shapes to this.group here
    }

    show(): void { this.group.visible(true); this.group.getLayer()?.draw(); }
    hide(): void { this.group.visible(false); this.group.getLayer()?.draw(); }
    getGroup(): Konva.Group { return this.group; }
}