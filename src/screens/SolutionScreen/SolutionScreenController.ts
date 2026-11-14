import type{ SolvedMainGameProblem } from "../../problem-engine/MainGameProblemGenerator.ts";
import  {SolutionScreenModel} from "./SolutionScreenModel.ts";
import  {SolutionScreenView} from "./solutionScreenView.ts";


export class SolutionScreenController{
    private readonly model: SolutionScreenModel;
    private readonly view: SolutionScreenView;

    constructor(problem: SolvedMainGameProblem) {
        this.model = new SolutionScreenModel(problem);
        this.view = new SolutionScreenView(() => {
        this.handleNextStep();
        });
        this.updateView();
    }
    private handleNextStep(): void {
        this.model.nextColumn();
        this.updateView();
    }

  private updateView(): void {
    this.view.render({
      step: this.model.getCurrentStep(),
      currentColumn: this.model.getCurrentColumn(),
      visibleColumns: this.model.getVisibleColumns(),
      hasNextColumn: this.model.hasNextColumn(),
    });
  }

  getView(): SolutionScreenView {
    return this.view;
  }

}

