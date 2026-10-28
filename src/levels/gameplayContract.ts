import type { AdventureMapScreenModel } from "../screens/AdventureMapScreen/AdventureMapScreenModel.ts";
import type { LevelType } from "./levelConfig.ts";

/** One started difficulty, with a callback bound to that launch. */
export interface GameplayLaunch {
  readonly topicId: LevelType;
  readonly levelId: string;
  /** One-based difficulty selected when the launch was created. */
  readonly currentDifficulty: number;
  /** Repeated or stale completion is rejected by the map model. */
  readonly onComplete: () => void;
}

// The exercise screen receives this launch data and reports its real result through onComplete.
export function launchCurrentLevel(mapModel: AdventureMapScreenModel): GameplayLaunch {
  const level = mapModel.getMapData().level;
  const currentDifficulty = mapModel.startCurrentDifficulty();
  return {
    topicId: level.type,
    levelId: level.id,
    currentDifficulty,
    onComplete: () => mapModel.completeActiveDifficulty(currentDifficulty),
  };
}
