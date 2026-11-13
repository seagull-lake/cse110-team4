import Konva from "konva";
import type{AdditionColumn, AdditionStep} from "../../problem-engine/MainGameProblemGenerator.ts";
import {
  FONT_FAMILY,
  STAGE_WIDTH,
  STAGE_HEIGHT,
} from "../../constants.ts";


interface SolutionViewData{
    step: AdditionStep;
    currentColumn: AdditionColumn | undefined;
    visibleColumns: readonly AdditionColumn[];
    hasNextColumn: boolean;
}

export class SolutionScreenView {
    private readonly group: Konva.Group;
    private readonly content: Konva.Group;
    private readonly onNextStep: () => void;

    constructor(onNextStep: () => void) {
        this.onNextStep = onNextStep;

        this.group = new Konva.Group({ visible: false });
        this.content = new Konva.Group();

        this.group.add(this.content);
  }
    render(data: SolutionViewData): void {
        this.content.destroyChildren();// Clear previous content
        this.group.getLayer()?.batchDraw();// Redraw the layer to reflect the changes
    }

    show():void{
        this.group.show();
        this.group.getLayer()?.batchDraw();
    }

    hide(): void {
        this.group.hide();
        this.group.getLayer()?.batchDraw();
    }

    getGroup(): Konva.Group {
        return this.group;
    }

}