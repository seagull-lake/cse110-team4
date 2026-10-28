import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { FractionSortScreenModel } from "./FractionSortScreenModel.ts";
import type { Bin } from "./FractionSortScreenModel.ts";
import { FractionSortScreenView } from "./FractionSortScreenView.ts";

const ROUND_SECONDS = 60;

export class FractionSortScreenController extends ScreenController {
    private model: FractionSortScreenModel;
    private view: FractionSortScreenView;
    private screenSwitcher: ScreenSwitcher;

    private timer: ReturnType<typeof setInterval> | null = null;
    private timeLeft = ROUND_SECONDS;
    private submitted = false;

    constructor(screenSwitcher: ScreenSwitcher) {
        super();
        this.screenSwitcher = screenSwitcher;
        this.model = new FractionSortScreenModel();
        this.view = new FractionSortScreenView(
            () => this.handleHomeClick(),
            (index, bin) => this.handleDrop(index, bin),
            () => this.handleSubmit(),
            () => this.handleContinue()
        );
    }

    /*------ Screen lifecycle ------*/

    // Called by main.ts whenever this screen opens (including after a refresh)
    show(): void {
        super.show();
        this.model.resetScore();
        this.view.updateScore(this.model.getScore());
        this.startRound();
    }

    // Called by main.ts whenever another screen opens -> always stop the timer
    hide(): void {
        this.stopTimer();
        super.hide();
    }

    /*------ Round flow ------*/

    private startRound(): void {
        this.model.newRound();
        this.submitted = false;

        this.view.showFractions(this.model.getMainFraction(), this.model.getChoiceFractions());
        this.view.showSortingMode();

        this.timeLeft = ROUND_SECONDS;
        this.view.updateTimer(this.timeLeft);
        this.stopTimer();   // never run two timers at once
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.view.updateTimer(this.timeLeft);
            if (this.timeLeft <= 0) this.handleSubmit();   // time's up = auto-submit
        }, 1000);
    }

    private stopTimer(): void {
        if (this.timer !== null) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    /*------ View callbacks ------*/

    // View reports where a fraction was dropped (null = outside every bin)
    private handleDrop(index: number, bin: Bin | null): void {
        if (this.submitted) return;
        this.model.setPlacement(index, bin);
    }

    private handleSubmit(): void {
        if (this.submitted) return;
        this.submitted = true;
        this.stopTimer();

        const correct = this.model.submit();
        this.view.showResults(this.model.getResults(), correct);
        this.view.updateScore(this.model.getScore());
    }

    private handleContinue(): void {
        this.startRound();
    }

    private handleHomeClick(): void {
        // stop any timers / save progress here before leaving
        this.screenSwitcher.switchToScreen({ type: "menu" });
    }

    getView(): FractionSortScreenView { return this.view; }
}