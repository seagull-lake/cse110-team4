import { ADDITION_LEVELS, problemDifficultyConfig, validateLevelDefinition } from "../../levels/levelConfig.ts";
import type { LevelDefinition } from "../../levels/levelConfig.ts";
import { completeLevel, initialProgression, isValidProgression, startLevel } from "../../levels/progression.ts";
import type { ProgressionState } from "../../levels/progression.ts";

/** Raw configuration and progress; the View decides how to display them. */
export interface AdventureMapData {
  readonly level: LevelDefinition;
  readonly progression: ProgressionState;
  readonly difficulties: readonly {
    readonly difficulty: number;
    readonly operandDigits: readonly number[];
  }[];
}

export class AdventureMapScreenModel {
  private state: ProgressionState;
  private readonly level: LevelDefinition;

  /** Starts at the first difficulty unless saved progress is given. */
  constructor(level: LevelDefinition = ADDITION_LEVELS, progression?: ProgressionState) {
    validateLevelDefinition(level);
    for (let difficulty = 1; difficulty <= level.maxDifficulty; difficulty++) {
      if (!problemDifficultyConfig.mainGame[level.type][difficulty]) {
        throw new Error(`No operand digits are configured for ${level.type} difficulty ${difficulty}.`);
      }
    }
    if (progression && !isValidProgression(level, progression)) {
      throw new Error("Invalid progression state.");
    }
    this.level = level;
    this.state = progression ?? initialProgression(level);
  }

  getMapData(): AdventureMapData {
    const difficulties = Array.from({ length: this.level.maxDifficulty }, (_, index) => ({
      difficulty: index + 1,
      operandDigits: problemDifficultyConfig.mainGame[this.level.type][index + 1],
    }));
    return { level: this.level, progression: this.state, difficulties };
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
