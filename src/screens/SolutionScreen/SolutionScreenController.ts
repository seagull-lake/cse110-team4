import type{ SolvedMainGameProblem } from "../../problem-engine/MainGameProblemGenerator.ts";
import  {SolutionScreenModel} from "./SolutionScreenModel.ts";
import  {SolutionScreenView} from "./solutionScreenView.ts";
import { ScreenController } from "../../types.ts";
import type { Screen, ScreenSwitcher } from "../../types.ts";
import type { LevelType } from "../../levels/levelConfig.ts";


export class SolutionScreenController extends ScreenController{
    private model: SolutionScreenModel | null = null;
    private readonly view: SolutionScreenView;
    private screen: Extract<Screen, { type: "solution" }> | null = null;

    constructor(screenSwitcher: ScreenSwitcher) {
        super();
        this.view = new SolutionScreenView(
            () => this.handleNextStep(),
            () => screenSwitcher.switchToScreen({ type: "menu" }),
            () => { if (this.screen) screenSwitcher.switchToScreen({ type: "adventuremap", topic: this.screen.topic }); },
        );
    }
    setProblem(problem: SolvedMainGameProblem, topic: LevelType, difficulty: number): void {
        this.screen = { type: "solution", problem, topic, difficulty };
        this.model = new SolutionScreenModel(problem);
        this.updateView();
    }
    private handleNextStep(): void {
        if (!this.model) return;
        this.model.nextPage();
        this.updateView();
    }

  private updateView(): void {
    if (!this.model || !this.screen) return;
    const page = this.model.getCurrentPage();
    if (page.operation === "multiplication") {
      const row = page.currentRow;
      const left = this.model.getCurrentStep().leftOperand;
      const multiplier = row ? row.multiplierDigit * row.multiplierPlaceValue : undefined;
      const explanation = row
        ? `${left} × ${multiplier} = ${row.partialProduct}`
        : `${page.visibleRows.map(partial => partial.partialProduct).join(" + ")} = ${page.finalAnswer}`;
      this.view.renderMultiplication(this.screen.difficulty, this.screen.problem, page, explanation);
      return;
    }
    if (page.operation === "division") {
      this.view.renderDivision(page.division, page.visibleBoxCount);
      return;
    }
    this.view.render({
      step: this.model.getCurrentStep(),
      currentColumn: page.operation === "addition" ? page.currentColumn : this.model.getCurrentColumn(),
      visibleColumns: page.operation === "addition" ? page.visibleColumns : this.model.getVisibleColumns(),
      hasNextColumn: page.operation === "addition" ? page.hasNext : this.model.hasNextColumn(),
    });
  }

  getView(): SolutionScreenView {
    return this.view;
  }

}

