import { MiniGameScoreManager } from "../../scoreManager.ts";

export const MAX_COMBO_MULTIPLIER = 10;

export interface Problem {
    firstOperand: number;
    operator: string;
    secondOperand: number;
    choices: number[];
    answer: number;
}

export class MultiplicationDivisionScreenModel {
    private readonly scoreManager = new MiniGameScoreManager("multiplication-division");
    private correctStreak = 0;
    private round = 0;
    private currentProblem: Problem | null = null;

    getRound(): number {
        return this.round;
    }

    getCombo(): number {
        return this.correctStreak;
    }

    getScore(): number {
        return this.scoreManager.getScore();
    }

    getHighScore(): number {
        return this.scoreManager.getHighScore();
    }

    newRound(problem: Problem): void {
        this.round++;
        this.currentProblem = problem;
    }

     getCorrectChoiceIndex(): number {
        if (this.currentProblem === null) return -1;
        return this.currentProblem.choices.indexOf(this.currentProblem.answer);
    }

    isCorrectChoice(index: number): boolean {
        if (this.currentProblem === null) return false;
        return this.currentProblem.choices[index] === this.currentProblem.answer;
    }

    recordAnswer(isCorrect: boolean, points: number): number {
        if (!isCorrect) {
            this.correctStreak = 0;
            return 0;
        }

        this.correctStreak++;
        const multiplier = Math.min(this.correctStreak, MAX_COMBO_MULTIPLIER);
        const awardedPoints = points * multiplier;
        this.scoreManager.addPoints(awardedPoints);
        return awardedPoints;
    }

    resetGame(): void {
        this.scoreManager.reset();
        this.correctStreak = 0;
        this.round = 0;
    }

    finishGame(): boolean {
        return this.scoreManager.finishGame();
    }
}