import type { LevelType } from "./levelConfig.ts";

// One clue per first completion of levels 1–4; level 5 reveals the treasure.
// Each topic has its own array so its clues can be changed independently.
export const treasureCluesByTopic: Record<LevelType, readonly [string, string, string, string]> = {
  addition: ["Numbers", "Keypad", "Operations", "Equals"],
  subtraction: ["Numbers", "Keypad", "Operations", "Equals"],
  multiplication: ["Numbers", "Keypad", "Operations", "Equals"],
  division: ["Numbers", "Keypad", "Operations", "Equals"],
};
