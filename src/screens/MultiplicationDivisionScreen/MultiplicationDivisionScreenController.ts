import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { MultiplicationDivisionScreenModel } from "./MultiplicationDivisionScreenModel.ts";
import { MultiplicationDivisionScreenView } from "./MultiplicationDivisionScreenView.ts";

export class MultiplicationDivisionScreenController extends ScreenController {
    private model: MultiplicationDivisionScreenModel;
    private view: MultiplicationDivisionScreenView;
    private screenSwitcher: ScreenSwitcher;

    constructor(screenSwitcher: ScreenSwitcher) {
        super();
        this.screenSwitcher = screenSwitcher;
        this.model = new MultiplicationDivisionScreenModel();
        this.view = new MultiplicationDivisionScreenView(() => this.handleHomeClick());
        this.view.updateScore(this.model.getScore());
    }

    recordAnswer(isCorrect: boolean, points: number): number {
        const awardedPoints = this.model.recordAnswer(isCorrect, points);
        this.view.updateScore(this.model.getScore());
        return awardedPoints;
    }

    private handleHomeClick(): void {
        // stop any timers / save progress here before leaving
        this.screenSwitcher.switchToScreen({ type: "menu" });
    }

    getView(): MultiplicationDivisionScreenView { return this.view; }
}