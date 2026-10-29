import { ADDITION_LEVELS, validateLevelDefinition } from "../../levels/levelConfig.ts";
import type { LevelDefinition } from "../../levels/levelConfig.ts";
import { completeLevel, initialProgression, startLevel } from "../../levels/progression.ts";
import type { ProgressionState } from "../../levels/progression.ts";

/** Raw configuration and progress; the View decides how to display them. */
export interface AdventureMapData {
  readonly level: LevelDefinition;
  readonly progression: ProgressionState;
}

export class AdventureMapScreenModel {
  private state: ProgressionState;
  private readonly level: LevelDefinition;

  constructor(level: LevelDefinition = ADDITION_LEVELS) {
    validateLevelDefinition(level);
    this.level = level;
    this.state = initialProgression(level);
  }

  getMapData(): AdventureMapData {
    return { level: this.level, progression: this.state };
  }

  startCurrentDifficulty(): number {
    const levelNumber = this.state.currentDifficulty;
    this.state = startLevel(this.level, this.state, this.level.id);
    return levelNumber;
  }

  completeActiveDifficulty(levelNumber: number): void {
    if (levelNumber !== this.state.currentDifficulty) {
      throw new Error("Only the active difficulty can be completed.");
    }
    this.state = completeLevel(this.level, this.state, this.level.id);
  }
}
