// Imports
import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { MultiplicationDivisionScreenModel, type Problem } from "./MultiplicationDivisionScreenModel.ts";
import { MultiplicationDivisionScreenView } from "./MultiplicationDivisionScreenView.ts";

// Constants
const GAME_SECONDS = 60;
const POINTS_PER_CORRECT = 50;

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
        const problem = this.makeProblem(); // change to problem generator once done
        this.model.newRound(problem);
        this.view.updateRound(this.model.getRound());
        this.view.showProblem(problem.firstOperand, problem.operator, problem.secondOperand);
        this.view.showChoices(problem.choices);
    }

    // TEMP stand-in until real problem generator is done
    private makeProblem(): Problem {
        const a = 2 + Math.floor(Math.random() * 11);
        const b = 2 + Math.floor(Math.random() * 11);
        const answer = a * b;
        const choices = [answer, answer + 2, answer - 3, answer + 10].sort(() => Math.random() - 0.5);
        return { firstOperand: a, operator: "x", secondOperand: b, choices, answer };
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
        // Correct Answer Behavior
        if (this.model.isCorrectChoice(index)) {
            const earned = this.recordAnswer(true, POINTS_PER_CORRECT);
            this.refreshCombo();
            this.view.showEarned(earned);
            this.startRound();
        }

        // TODO: Wrong Answer Behavior
    }
    
    /*------ Helpers ------*/

    // The label shows how many correct answers in a row there are, so it starts at 0
    private refreshCombo(): void {
        this.view.updateCombo(this.model.getCombo());
    }

    getView(): MultiplicationDivisionScreenView { return this.view; }
}