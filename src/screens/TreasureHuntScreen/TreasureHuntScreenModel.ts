import { getAllLevelDefinitions } from "../../levels/levelConfig.ts";
import type { LevelType } from "../../levels/levelConfig.ts";
import { progressCount } from "../../levels/progression.ts";
import { loadProgression } from "../../storage.ts";

export interface TopicTreasure {
    readonly topic: LevelType;
    readonly label: string;
    readonly isUnlocked: boolean;
    /** Levels finished in this topic (one clue each); equals totalClues once the treasure is collected. */
    readonly cluesFound: number;
    readonly totalClues: number;
}

export interface TreasureHuntData {
    readonly treasures: readonly TopicTreasure[];
    readonly collectedCount: number;
    readonly isUltimateUnlocked: boolean;
}

const TOPIC_LABELS: Record<LevelType, string> = {
    addition: "Addition", subtraction: "Subtraction",
    multiplication: "Multiplication", division: "Division",
};

export class TreasureHuntScreenModel {
    /** Rewards follow saved topic completion, so revisits never create duplicate rewards. */
    getTreasureData(): TreasureHuntData {
        const treasures = getAllLevelDefinitions().map(level => {
            const state = loadProgression(level);
            const { completed, total } = progressCount(level, state);
            return {
                topic: level.type,
                label: TOPIC_LABELS[level.type],
                isUnlocked: state.isCompleted,
                cluesFound: completed,
                totalClues: total,
            };
        });
        return {
            treasures,
            collectedCount: treasures.filter(treasure => treasure.isUnlocked).length,
            isUltimateUnlocked: treasures.every(treasure => treasure.isUnlocked),
        };
    }
}
