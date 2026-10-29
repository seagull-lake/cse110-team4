import { MiniGameScoreManager } from "../../scoreManager.ts";

const COMBO_THRESHOLD = 2;
const COMBO_MULTIPLIER = 2;

export class MultiplicationDivisionScreenModel {
    private readonly scoreManager = new MiniGameScoreManager("multiplication-division");
    private correctStreak = 0;

    addPoints(points: number): void {
        this.scoreManager.addPoints(points);
    }

    recordAnswer(isCorrect: boolean, points: number): number {
        if (!isCorrect) {
            this.correctStreak = 0;
            return 0;
        }

        this.correctStreak++;
        const awardedPoints = points * (this.correctStreak >= COMBO_THRESHOLD ? COMBO_MULTIPLIER : 1);
        this.scoreManager.addPoints(awardedPoints);
        return awardedPoints;
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

    resetGame(): void {
        this.scoreManager.reset();
        this.correctStreak = 0;
    }

    finishGame(): boolean {
        return this.scoreManager.finishGame();
    }
}