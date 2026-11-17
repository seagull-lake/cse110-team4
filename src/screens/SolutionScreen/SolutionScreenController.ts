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

    /** Connect solution controls to page and screen navigation. */
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

    /** Open the supplied problem at its first solution page. */
    setProblem(problem: SolvedMainGameProblem, topic: LevelType, difficulty: number): void {
        this.model = new SolutionScreenModel(problem, topic, difficulty);
        this.updateView();
    }

    /** Advance one page through the model, then redraw. */
    private handleNextStep(): void {
        if (!this.model) return;
        this.model.nextPage();
        this.updateView();
    }

    /** Render the current page using its operation-specific view. */
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
                    // Sum the revealed partial products.
                    explanation = `${page.visibleRows.map(row => row.partialProduct).join(" + ")} = ${page.finalAnswer}`;
                }
                const { difficulty } = this.model.getContext();
                this.view.renderMultiplication(difficulty, this.model.getProblem(), page, explanation);
                break;
            }
            case "division":
                this.view.renderDivision(page.division, page.visibleBoxCount);
                break;
            case "addition": {
                const addition = this.model.getAdditionPage();
                this.view.renderAddition(addition.step, addition.pageIndex, this.model.getContext().difficulty);
                break;
            }
            case "subtraction":
                this.view.renderSubtraction(this.model.getSubtractionPage());
                break;
        }
    }

    /** Expose the reusable solution view to the application. */
    getView(): SolutionScreenView { return this.view; }
}

