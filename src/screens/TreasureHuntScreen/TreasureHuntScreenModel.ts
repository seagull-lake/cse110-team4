import { getAllLevelDefinitions } from "../../levels/levelConfig.ts";
import type { LevelType } from "../../levels/levelConfig.ts";
import { loadProgression } from "../../storage.ts";

export interface TopicTreasure {
    readonly topic: LevelType;
    readonly label: string;
    readonly isUnlocked: boolean;
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
        const treasures = getAllLevelDefinitions().map(level => ({
            topic: level.type,
            label: TOPIC_LABELS[level.type],
            isUnlocked: loadProgression(level).isCompleted,
        }));
        return {
            treasures,
            collectedCount: treasures.filter(treasure => treasure.isUnlocked).length,
            isUltimateUnlocked: treasures.every(treasure => treasure.isUnlocked),
        };
    }
}
