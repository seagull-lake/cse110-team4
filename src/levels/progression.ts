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

/** How the map shows one difficulty. */
export type LevelStatus = "completed" | "current" | "locked";

/** Completed below the current difficulty (or everywhere once all are done), locked above it. */
export function getLevelStatus(state: ProgressionState, difficulty: number): LevelStatus {
  if (state.isCompleted || difficulty < state.currentDifficulty) return "completed";
  return difficulty === state.currentDifficulty ? "current" : "locked";
}

/** True when the difficulty exists for this level and can be played (completed or current, not locked). */
export function isLevelUnlocked(level: LevelDefinition, state: ProgressionState, difficulty: number): boolean {
  return Number.isInteger(difficulty) && difficulty >= 1 && difficulty <= level.maxDifficulty &&
    getLevelStatus(state, difficulty) !== "locked";
}

/** The same progress as lists: which difficulties are done, which one is next, which are locked. */
export interface ProgressSummary {
  readonly completed: readonly number[];
  /** Null once every difficulty is completed. */
  readonly current: number | null;
  readonly locked: readonly number[];
}

export function getProgressSummary(level: LevelDefinition, state: ProgressionState): ProgressSummary {
  assertValidState(level, state);
  const completed: number[] = [];
  const locked: number[] = [];
  let current: number | null = null;
  for (let difficulty = 1; difficulty <= level.maxDifficulty; difficulty++) {
    const status = getLevelStatus(state, difficulty);
    if (status === "completed") completed.push(difficulty);
    else if (status === "current") current = difficulty;
    else locked.push(difficulty);
  }
  return { completed, current, locked };
}

/** True when the state is consistent with the level (used before trusting saved data). */
export function isValidProgression(level: LevelDefinition, state: ProgressionState): boolean {
  return state.levelId === level.id &&
    Number.isInteger(state.currentDifficulty) && state.currentDifficulty >= 1 &&
    state.currentDifficulty <= level.maxDifficulty &&
    !(state.isActive && state.isCompleted) &&
    !(state.isCompleted && state.currentDifficulty !== level.maxDifficulty);
}

function assertValidState(level: LevelDefinition, state: ProgressionState): void {
  if (!isValidProgression(level, state)) throw new Error("Invalid progression state.");
}
