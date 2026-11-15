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
    private readonly group: Konva.Group;//the main group that contains all the content of the solution screen
    private readonly content: Konva.Group;//the group that contains the content of the solution screen, which can be cleared and redrawn
    private readonly divisionView: DivisionSolutionView;//the view that displays the division solution, which is kept alive while redrawing the revealed boxes

    constructor(onNextStep: () => void) {//report button clicks to the Controller, which updates the Model
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
