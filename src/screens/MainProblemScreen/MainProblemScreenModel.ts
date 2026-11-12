import { getLevelDefinition } from "../../levels/levelConfig.ts";
import type { LevelDefinition, LevelType } from "../../levels/levelConfig.ts";

/** The level being played: which topic and which difficulty. The problem itself comes in a later step. */
export class MainProblemScreenModel {
  private readonly level: LevelDefinition;
  private readonly difficulty: number;

  constructor(topic: LevelType, difficulty: number) {
    this.level = getLevelDefinition(topic);
    if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > this.level.maxDifficulty) {
      throw new Error(`${topic} has no difficulty ${difficulty}.`);
    }
    this.difficulty = difficulty;
  }

  getTopic(): LevelType { return this.level.type; }
  getDifficulty(): number { return this.difficulty; }

  /** e.g. "Addition – Level 3" */
  getTitle(): string {
    const topic = this.level.type;
    return `${topic[0].toUpperCase()}${topic.slice(1)} – Level ${this.difficulty}`;
  }
}
