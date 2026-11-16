import type{ SolvedMainGameProblem } from "../../problem-engine/MainGameProblemGenerator.ts";
import  {SolutionScreenModel} from "./SolutionScreenModel.ts";
import  {SolutionScreenView} from "./solutionScreenView.ts";
import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import type { LevelType } from "../../levels/levelConfig.ts";

export class SolutionScreenController extends ScreenController{
    private model: SolutionScreenModel | null = null;
    private readonly view: SolutionScreenView;
    private readonly screenSwitcher: ScreenSwitcher;
    private topic: LevelType = "addition";
    private difficulty = 1;

  constructor(screenSwitcher: ScreenSwitcher) {
        super();
        this.screenSwitcher = screenSwitcher;
        this.view = new SolutionScreenView(
          () => this.handleNextStep(),
          () => this.screenSwitcher.switchToScreen({ type: "menu" }),                           
          () => this.screenSwitcher.switchToScreen({ type: "adventuremap", topic: this.topic }), 
        );
    }
  setProblem(problem: SolvedMainGameProblem, topic: LevelType, difficulty: number): void {
        this.model = new SolutionScreenModel(problem);
        this.topic = topic;
        this.difficulty = difficulty;
        this.updateView();
    }

    private handleNextStep(): void {
        if (!this.model) return;
        const operation = this.model.getCurrentStep().operation;
        if (operation === "division") {
            this.model.nextDivisionPage();
        } 
        else if (operation === "multiplication") {
            this.model.nextMultiplicationPage();
        }
        else if (operation === "addition") {
            this.model.nextAdditionPage();
        }
        else if (operation === "subtraction") {
            this.model.nextSubtractionPage();
        }
        else {
            this.model.nextColumn();
        }
        this.updateView();
    }

  private updateView(): void {
    if (!this.model) return;
    const operation = this.model.getCurrentStep().operation;
    if (operation === "division") {
      const page = this.model.getDivisionPage();
      this.view.renderDivision(page.division, page.visibleBoxCount);
      return;
    }

    if (operation === "multiplication") {
      const page = this.model.getMultiplicationPage();
      let explanation = "";
      if (page.currentRow) {
        const { multiplierDigit, multiplierPlaceValue, partialProduct } = page.currentRow;
        explanation = `${this.model.getCurrentStep().leftOperand} × ${multiplierDigit * multiplierPlaceValue} = ${partialProduct}`;
      } else if (page.finalAnswer !== undefined) {
        explanation = `${page.visibleRows.map(row => row.partialProduct).join(" + ")} = ${page.finalAnswer}`;
      }
      this.view.renderMultiplication(this.difficulty, this.model.getProblem(), page, explanation);
      return;
    }

    if (operation === "addition") {
      const page = this.model.getAdditionPage();
      this.view.renderAddition(page.step, page.pageIndex, this.difficulty);
      return;
    }

    if (operation === "subtraction") {
      this.view.renderSubtraction(this.model.getSubtractionPage());
      return;
    }

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

