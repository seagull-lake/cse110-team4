import { MiniGameScoreManager } from "../../scoreManager.ts";

export class MultiplicationDivisionScreenModel {
    private readonly scoreManager = new MiniGameScoreManager("multiplication-division");

    addPoints(points: number): void {
        this.scoreManager.addPoints(points);
    }

    getScore(): number {
        return this.scoreManager.getScore();
    }

    getHighScore(): number {
        return this.scoreManager.getHighScore();
    }

    resetGame(): void {
        this.scoreManager.reset();
    }

    finishGame(): boolean {
        return this.scoreManager.finishGame();
    }
}