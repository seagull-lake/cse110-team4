import { loadHighScore, saveHighScore } from "./storage.ts";
import type { MiniGameId } from "./storage.ts";

export class MiniGameScoreManager {
    private score = 0;
    private highScore: number;
    private readonly gameId: MiniGameId;

    constructor(gameId: MiniGameId) {
        this.gameId = gameId;
        this.highScore = loadHighScore(gameId);
    }

    addPoints(points: number): void {
        this.score += points;
    }

    getScore(): number {
        return this.score;
    }

    getHighScore(): number {
        return this.highScore;
    }

    reset(): void {
        this.score = 0;
    }

    finishGame(): boolean {
        if (this.score <= this.highScore) return false;

        this.highScore = this.score;
        saveHighScore(this.gameId, this.highScore);
        return true;
    }
}
