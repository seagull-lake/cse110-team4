import type { LevelType } from "./levelConfig.ts";

export interface TopicTreasureDefinition {
  readonly kind: "abacus" | "pencil" | "calculator" | "scale";
  readonly name: string;
}

export const treasuresByTopic: Record<LevelType, TopicTreasureDefinition> = {
  addition: { kind: "abacus", name: "Abacus" },
  subtraction: { kind: "pencil", name: "Pencil" },
  multiplication: { kind: "calculator", name: "Calculator" },
  division: { kind: "scale", name: "Scale" },
};

// One clue per first completion of levels 1–4; level 5 reveals the treasure.
// Each topic has its own array so its clues can be changed independently.
export const treasureCluesByTopic: Record<LevelType, readonly [string, string, string, string]> = {
  addition: ["Counting", "Frame", "Rods", "Beads"],
  subtraction: ["Writing", "Wood", "Eraser", "Graphite"],
  multiplication: ["Numbers", "Keypad", "Operations", "Equals"],
  division: ["Balance", "Weights", "Pans", "Equal sides"],
};
