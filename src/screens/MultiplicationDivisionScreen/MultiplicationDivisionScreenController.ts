// Imports
import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { MultiplicationDivisionScreenModel } from "./MultiplicationDivisionScreenModel.ts";
import { MultiplicationDivisionScreenView } from "./MultiplicationDivisionScreenView.ts";

// Constants
const GAME_SECONDS = 60;

export class MultiplicationDivisionScreenController extends ScreenController {
    private model: MultiplicationDivisionScreenModel;
    private view: MultiplicationDivisionScreenView;
    private screenSwitcher: ScreenSwitcher;

    // Timer
    private timer: ReturnType<typeof setInterval> | null = null;
    private timeLeft = GAME_SECONDS;

    constructor(screenSwitcher: ScreenSwitcher) {
        super();
        this.screenSwitcher = screenSwitcher;
        this.model = new MultiplicationDivisionScreenModel();
        this.view = new MultiplicationDivisionScreenView(
            () => this.handleHomeClick(),
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
        this.view.showGame();
        // this.model.resetGame();
        // this.view.updateHighScore(this.model.getHighScore());
        // this.view.updateScore(this.model.getScore());

        this.timeLeft = GAME_SECONDS;
        this.view.updateTimer(this.timeLeft, GAME_SECONDS);
        this.stopTimer();   // never run two timers at once
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.view.updateTimer(this.timeLeft, GAME_SECONDS);
            if (this.timeLeft <= 0) this.endGame();   // time's up = game over
        }, 1000);

        // this.startRound();
    }

    private endGame(): void {
        this.stopTimer();
        // this.submitted = true;   // ignore any drops/clicks still in progress

        // const isNewHighScore = this.model.finishGame();
        // this.view.updateHighScore(this.model.getHighScore());
        this.view.showGameOver();
    }

    private stopTimer(): void {
        if (this.timer !== null) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    /*------ View callbacks ------*/

    private handlePlayAgain(): void {
        this.startGame();
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