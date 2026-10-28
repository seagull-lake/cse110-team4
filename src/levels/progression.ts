import type { LevelDefinition } from "./levelConfig.ts";

export interface ProgressionState {
  readonly currentDifficulty: number;
  readonly isActive: boolean;
  readonly levelId: string;
}

export function levelId(level: LevelDefinition): string {
  return level.id;
}

export function initialProgression(level: LevelDefinition): ProgressionState {
  return { currentDifficulty: 1, isActive: false, levelId: levelId(level) };
}

export function startLevel(
  level: LevelDefinition, state: ProgressionState, id: string,
): ProgressionState {
  assertValidState(level, state);
  if (state.isActive) throw new Error("A level is already active.");
  if (id !== levelId(level) ||
      state.currentDifficulty > level.difficulty.length) {
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
  return { currentDifficulty: state.currentDifficulty + 1, isActive: false, levelId: levelId(level) };
}

export function progressCount(level: LevelDefinition, state: ProgressionState): {
  completed: number; total: number;
} {
  assertValidState(level, state);
  return { completed: state.currentDifficulty - 1, total: level.difficulty.length };
}

function assertValidState(level: LevelDefinition, state: ProgressionState): void {
  if (state.levelId !== level.id ||
      !Number.isInteger(state.currentDifficulty) || state.currentDifficulty < 1 ||
      state.currentDifficulty > level.difficulty.length + 1 ||
      (state.isActive && state.currentDifficulty > level.difficulty.length)) {
    throw new Error("Invalid progression state.");
  }
}
