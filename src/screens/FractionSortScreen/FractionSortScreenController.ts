import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { FractionSortScreenModel } from "./FractionSortScreenModel.ts";
import type { Bin } from "./FractionSortScreenModel.ts";
import { FractionSortScreenView } from "./FractionSortScreenView.ts";

const GAME_SECONDS = 60;

export class FractionSortScreenController extends ScreenController {
    private model: FractionSortScreenModel;
    private view: FractionSortScreenView;
    private screenSwitcher: ScreenSwitcher;

    private timer: ReturnType<typeof setInterval> | null = null;
    private timeLeft = GAME_SECONDS;
    private submitted = false;

    constructor(screenSwitcher: ScreenSwitcher) {
        super();
        this.screenSwitcher = screenSwitcher;
        this.model = new FractionSortScreenModel();
        this.view = new FractionSortScreenView(
            () => this.handleHomeClick(),
            (index, bin) => this.handleDrop(index, bin),
            () => this.handleSubmit(),
            () => this.handleContinue(),
            () => this.handlePlayAgain()
        );
    }

    /*------ Screen lifecycle ------*/

    // Called by main.ts whenever this screen opens (including after a refresh)
    show(): void {
        super.show();
        this.startGame();
    }

    // Called by main.ts whenever another screen opens -> always stop the timer
    hide(): void {
        this.stopTimer();
        super.hide();
    }

    /*------ Game flow ------*/

    // New game: reset score/round, start the 1-minute timer, start round 1
    private startGame(): void {
        this.model.resetGame();
        this.view.updateHighScore(this.model.getHighScore());
        this.view.updateScore(this.model.getScore());

        this.timeLeft = GAME_SECONDS;
        this.view.updateTimer(this.timeLeft, GAME_SECONDS);
        this.stopTimer();   // never run two timers at once
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.view.updateTimer(this.timeLeft, GAME_SECONDS);
            if (this.timeLeft <= 0) this.endGame();   // time's up = game over
        }, 1000);

        this.startRound();
    }

    private startRound(): void {
        this.model.newRound();
        this.submitted = false;

        this.view.showFractions(this.model.getMainFraction(), this.model.getChoiceFractions(), this.model.getRound());
        this.view.updateRemaining(this.model.getRemainingCount());
        this.view.showSortingMode();
    }

    private endGame(): void {
        this.stopTimer();
        this.submitted = true;   // ignore any drops/clicks still in progress

        const isNewHighScore = this.model.finishGame();
        this.view.updateHighScore(this.model.getHighScore());
        this.view.showGameOver(this.model.getScore(), this.model.getHighScore(), isNewHighScore);
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
        if (!this.submitted) this.model.setPlacement(index, bin);

        // Model is the source of truth: redraw tiles where the model says they are
        this.view.placeTiles(this.model.getPlacements());
        this.view.updateRemaining(this.model.getRemainingCount());
    }

    private handleSubmit(): void {
        if (this.submitted) return;
        this.submitted = true;

        const correct = this.model.submit();
        this.view.showResults(this.model.getResults(), this.model.allCorrect(), correct, this.model.getScore());
        this.view.updateScore(this.model.getScore());
    }

    private handleContinue(): void {
        this.startRound();
    }

    private handlePlayAgain(): void {
        this.startGame();
    }

    private handleHomeClick(): void {
        // stop any timers / save progress here before leaving
        this.screenSwitcher.switchToScreen({ type: "menu" });
    }

    getView(): FractionSortScreenView { return this.view; }
}