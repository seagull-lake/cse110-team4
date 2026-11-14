import type { SolvedMainGameProblem } from "../../problem-engine/MainGameProblemGenerator.ts";
import type { LevelType } from "../../levels/levelConfig.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { ScreenController } from "../../types.ts";
import { SolutionScreenModel } from "./SolutionScreenModel.ts";
import { SolutionScreenView } from "./solutionScreenView.ts";

export class SolutionScreenController extends ScreenController {
    private model: SolutionScreenModel | null = null;
    private readonly view: SolutionScreenView;
    private readonly screenSwitcher: ScreenSwitcher;

    constructor(screenSwitcher: ScreenSwitcher) {
        super();
        this.screenSwitcher = screenSwitcher;
        this.view = new SolutionScreenView(
            () => this.handleNextStep(),
            () => this.screenSwitcher.switchToScreen({ type: "menu" }),
            () => {
                if (this.model) this.screenSwitcher.switchToScreen({
                    type: "adventuremap", topic: this.model.getContext().topic,
                });
            },
        );
    }

    setProblem(problem: SolvedMainGameProblem, topic: LevelType, difficulty: number): void {
        this.model = new SolutionScreenModel(problem, topic, difficulty);
        this.updateView();
    }

    private handleNextStep(): void {
        if (!this.model) return;
        this.model.nextPage();
        this.updateView();
    }

    private updateView(): void {
        if (!this.model) return;
        const page = this.model.getCurrentPage();
        switch (page.operation) {
            case "multiplication": {
                let explanation = "";
                if (page.currentRow) {
                    const { multiplierDigit, multiplierPlaceValue, partialProduct } = page.currentRow;
                    explanation = `${this.model.getCurrentStep().leftOperand} × ${multiplierDigit * multiplierPlaceValue} = ${partialProduct}`;
                } else if (page.finalAnswer !== undefined) {
                    explanation = `${page.visibleRows.map(row => row.partialProduct).join(" + ")} = ${page.finalAnswer}`;
                }
                const { problem, difficulty } = this.model.getContext();
                this.view.renderMultiplication(difficulty, problem, page, explanation);
                break;
            }
            case "division":
                this.view.renderDivision(page.division, page.visibleBoxCount);
                break;
            case "addition":
            case "subtraction":
                this.view.render({
                    step: this.model.getCurrentStep(),
                    currentColumn: this.model.getCurrentColumn(),
                    visibleColumns: this.model.getVisibleColumns(),
                    hasNextColumn: this.model.hasNextColumn(),
                });
                break;
        }
    }

    getView(): SolutionScreenView { return this.view; }
}

