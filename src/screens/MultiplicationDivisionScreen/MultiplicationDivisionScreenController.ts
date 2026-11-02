// Imports
import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { MultiplicationDivisionScreenModel } from "./MultiplicationDivisionScreenModel.ts";
import { MultiplicationDivisionProblems } from "./MultiplicationDivisionProblems.ts";
import { MultiplicationDivisionScreenView } from "./MultiplicationDivisionScreenView.ts";

// Constants
const GAME_SECONDS = 60;
const POINTS_PER_CORRECT = 50;
const WRONG_FEEDBACK_MS = 800;   // how long the wrong/correct answers stay highlighted after a miss

export class MultiplicationDivisionScreenController extends ScreenController {
    private model: MultiplicationDivisionScreenModel;
    private view: MultiplicationDivisionScreenView;
    private screenSwitcher: ScreenSwitcher;
    private problems = new MultiplicationDivisionProblems();

    // Timer
    private timer: ReturnType<typeof setInterval> | null = null;
    private timeLeft = GAME_SECONDS;

    // Wrong-answer feedback: while set, clicks are ignored until the next question appears
    private feedbackTimeout: ReturnType<typeof setTimeout> | null = null;

    constructor(screenSwitcher: ScreenSwitcher) {
        super();
        this.screenSwitcher = screenSwitcher;
        this.model = new MultiplicationDivisionScreenModel();
        this.view = new MultiplicationDivisionScreenView(
            () => this.handleHomeClick(),
            () => this.handlePlayAgain(),
            (index) => this.handleChoiceClick(index)
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
        this.model.resetGame();
        this.view.updateHighScore(this.model.getHighScore());
        this.view.updateScore(this.model.getScore());
        this.refreshCombo();
        this.view.showEarned(0);

        // Timer Mechanics
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
        this.view.resetChoiceColors();
        const problem = this.problems.next();
        this.model.newRound(problem);
        this.view.updateRound(this.model.getRound());
        this.view.showProblem(problem.firstOperand, problem.operator, problem.secondOperand);
        this.view.showChoices(problem.choices);
    }

    private recordAnswer(isCorrect: boolean, points: number): number {
        const awardedPoints = this.model.recordAnswer(isCorrect, points);
        this.view.updateScore(this.model.getScore());
        return awardedPoints;
    }

    private endGame(): void {
        this.stopTimer();
        const isNewHighScore = this.model.finishGame();
        this.view.showGameOver(this.model.getScore(), this.model.getHighScore(), isNewHighScore);
    }

    private stopTimer(): void {
        if (this.timer !== null) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.clearFeedback();
    }

    // Cancels a pending "move to next question" after a wrong answer
    private clearFeedback(): void {
        if (this.feedbackTimeout !== null) {
            clearTimeout(this.feedbackTimeout);
            this.feedbackTimeout = null;
        }
    }

    /*------ View callbacks ------*/

    private handleHomeClick(): void {
        // stop any timers / save progress here before leaving
        this.screenSwitcher.switchToScreen({ type: "menu" });
    }

    private handlePlayAgain(): void {
        this.startGame();
    }

    private handleChoiceClick(index: number): void {
        // Ignore clicks while the wrong-answer feedback is showing or after time is up
        if (this.feedbackTimeout !== null || this.timer === null) return;

        // Correct Answer Behavior
        if (this.model.isCorrectChoice(index)) {
            const earned = this.recordAnswer(true, POINTS_PER_CORRECT);
            this.refreshCombo();
            this.view.showEarned(earned);
            this.startRound();
            return;
        }

        // Wrong Answer Behavior: no points, combo resets to 0,
        // show the picked answer in red and the right answer in green, then move on.
        // The 1-minute timer keeps running during the feedback.
        this.recordAnswer(false, POINTS_PER_CORRECT);
        this.refreshCombo();
        this.view.showIncorrect();
        this.view.showWrongAnswer(index, this.model.getCorrectChoiceIndex());
        this.feedbackTimeout = setTimeout(() => {
            this.feedbackTimeout = null;
            this.view.showEarned(0);   // clear "Incorrect" when the next question 
            this.startRound();
        }, WRONG_FEEDBACK_MS);
    }
    
    /*------ Helpers ------*/

    // The label shows how many correct answers in a row there are, so it starts at 0
    private refreshCombo(): void {
        this.view.updateCombo(this.model.getCombo());
    }

    getView(): MultiplicationDivisionScreenView { return this.view; }
}