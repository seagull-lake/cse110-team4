import type { LevelDefinition } from "./levelConfig.ts";

/** Runtime progress for one operation's ordered difficulties. */
export interface ProgressionState {
  /** One-based; stays on the final difficulty after completion. */
  readonly currentDifficulty: number;
  /** True between starting a difficulty and completing it. */
  readonly isActive: boolean;
  /** True only after the final difficulty is completed. */
  readonly isCompleted: boolean;
  /** Must match the associated LevelDefinition.id. */
  readonly levelId: string;
}

export function levelId(level: LevelDefinition): string {
  return level.id;
}

export function initialProgression(level: LevelDefinition): ProgressionState {
  return { currentDifficulty: 1, isActive: false, isCompleted: false, levelId: levelId(level) };
}

export function startLevel(
  level: LevelDefinition, state: ProgressionState, id: string,
): ProgressionState {
  assertValidState(level, state);
  if (state.isCompleted) throw new Error("All levels are complete.");
  if (state.isActive) throw new Error("A level is already active.");
  if (id !== levelId(level)) {
    throw new Error("Level is unknown, locked or completed.");
  }
  return { ...state, isActive: true, levelId: levelId(level) };
}

export function completeLevel(
  level: LevelDefinition, state: ProgressionState, id: string,
): ProgressionState {
  assertValidState(level, state);
  if (!state.isActive || id !== levelId(level)) {
    throw new Error("Only the active level can be completed.");
  }
  if (state.currentDifficulty === level.maxDifficulty) {
    return { ...state, isActive: false, isCompleted: true };
  }
  return { ...state, currentDifficulty: state.currentDifficulty + 1, isActive: false };
}

export function progressCount(level: LevelDefinition, state: ProgressionState): {
  completed: number; total: number;
} {
  assertValidState(level, state);
  return { completed: state.isCompleted ? level.maxDifficulty : state.currentDifficulty - 1,
    total: level.maxDifficulty };
}

function assertValidState(level: LevelDefinition, state: ProgressionState): void {
  if (state.levelId !== level.id ||
      !Number.isInteger(state.currentDifficulty) || state.currentDifficulty < 1 ||
      state.currentDifficulty > level.maxDifficulty ||
      (state.isActive && state.isCompleted) ||
      (state.isCompleted && state.currentDifficulty !== level.maxDifficulty)) {
    throw new Error("Invalid progression state.");
  }
}
