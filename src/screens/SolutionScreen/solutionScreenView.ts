import Konva from "konva";
import type{AdditionColumn, SolutionStep, DivisionBoxMethod} from "../../problem-engine/MainGameProblemGenerator.ts";
import { DivisionSolutionView } from "./DivisionSolutionView.ts";


interface SolutionViewData{
    step: SolutionStep;
    currentColumn: AdditionColumn | undefined;
    visibleColumns: readonly AdditionColumn[];
    hasNextColumn: boolean;
}

export class SolutionScreenView {
    private readonly group: Konva.Group;
    private readonly content: Konva.Group;
    private readonly divisionView: DivisionSolutionView;

    constructor(onNextStep: () => void) {
        this.divisionView = new DivisionSolutionView(onNextStep);

        this.group = new Konva.Group({ visible: false });
        this.content = new Konva.Group();

        this.group.add(this.content);
  }
    render(_data: SolutionViewData): void {
        this.content.destroyChildren();// Clear previous content
        this.group.getLayer()?.batchDraw();// Redraw the layer to reflect the changes
    }

    // Keep the division View alive while redrawing the revealed boxes.
    renderDivision(division: DivisionBoxMethod, visibleBoxCount: number): void {
        this.content.removeChildren();
        this.content.add(this.divisionView.getGroup());
        this.divisionView.render(division, visibleBoxCount);
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
