import type{ SolvedMainGameProblem } from "../../problem-engine/MainGameProblemGenerator.ts";
import  {SolutionScreenModel} from "./SolutionScreenModel.ts";
import  {SolutionScreenView} from "./solutionScreenView.ts";
import { ScreenController } from "../../types.ts";


export class SolutionScreenController extends ScreenController{
    private model: SolutionScreenModel | null = null;
    private readonly view: SolutionScreenView;

    constructor() {
        super();
        this.view = new SolutionScreenView(() => {//report button clicks to the Controller, which updates the Model
          this.handleNextStep();
        });
    }
    setProblem(problem: SolvedMainGameProblem): void {//initialize the model with the solved problem and update the view
        this.model = new SolutionScreenModel(problem);
        this.updateView();
    }
    private handleNextStep(): void {//reveal the next column or division box in the solution
        if (!this.model) return;//if the model is not initialized, do nothing
        if (this.model.getCurrentStep().operation === "division") {
            this.model.nextDivisionPage();//reveal the next box in the division solution
        } else {
            this.model.nextColumn();
        }
        this.updateView();//update the view after user click next step button
    }

  private updateView(): void {
    if (!this.model) return;
    if (this.model.getCurrentStep().operation === "division") {
      const page = this.model.getDivisionPage();//get the current division page from the model
      this.view.renderDivision(page.division, page.visibleBoxCount);//render the division page in the view
      return;
    }
    this.view.render({//render the current step in the view
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

