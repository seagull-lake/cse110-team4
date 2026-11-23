import { getLevelDefinition } from "../../levels/levelConfig.ts";
import type { LevelType } from "../../levels/levelConfig.ts";
import { treasureCluesByTopic, treasuresByTopic } from "../../levels/treasureConfig.ts";
import type { TopicTreasureDefinition } from "../../levels/treasureConfig.ts";

export type TreasureRewardType = "clue" | "treasure" | "ultimate";

interface TreasureRewardProgress {
    readonly topic: LevelType;
    readonly difficulty: number;
    readonly cluesFound: number;
    readonly totalClues: number;
    readonly hasNext: boolean;
}

export type TreasureRewardPage = TreasureRewardProgress & (
    { readonly type: "clue"; readonly clue: string } |
    { readonly type: "treasure"; readonly treasure: TopicTreasureDefinition } |
    { readonly type: "ultimate" }
);

export class TreasureRewardScreenModel {
    private readonly topic: LevelType;
    private readonly difficulty: number;
    private readonly totalClues: number;
    private readonly allTopicsCompleted: boolean;
    private rewardType: TreasureRewardType;

    constructor(topic: LevelType, difficulty: number, allTopicsCompleted = false) {
        const level = getLevelDefinition(topic);
        if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > level.maxDifficulty) {
            throw new Error("Reward difficulty must be a valid level.");
        }
        if (allTopicsCompleted && difficulty !== level.maxDifficulty) {
            throw new Error("Ultimate treasure requires completing the final level.");
        }
        this.topic = topic;
        this.difficulty = difficulty;
        this.totalClues = level.maxDifficulty;
        this.allTopicsCompleted = allTopicsCompleted;
        this.rewardType = difficulty === level.maxDifficulty ? "treasure" : "clue";
    }
    getCurrentPage(): TreasureRewardPage {
        const progress = {
            topic: this.topic,
            difficulty: this.difficulty,
            cluesFound: this.difficulty,
            totalClues: this.totalClues,
            hasNext: this.rewardType === "treasure" && this.allTopicsCompleted,
        };
        if (this.rewardType === "clue") {
            return {
                ...progress,
                type: "clue",
                clue: treasureCluesByTopic[this.topic][this.difficulty - 1],
            };
        }
        if (this.rewardType === "treasure") {
            return { ...progress, type: "treasure", treasure: treasuresByTopic[this.topic] };
        }
        return { ...progress, type: "ultimate" };
    }
    nextPage(): void {
        if (this.getCurrentPage().hasNext) {
            this.rewardType = "ultimate";
        }
    }
}
