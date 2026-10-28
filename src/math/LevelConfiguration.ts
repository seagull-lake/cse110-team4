import { validateRange } from "./NumberGenerator.ts";
import type { DifficultyLevel, LevelConfig } from "../interfaces/GameInterfaces.ts";
// 1. return the number ranges for a level. Both endpoints in [min, max] are inclusive.
export function getLevelConfig(level: DifficultyLevel): LevelConfig {
  if (level === 1) {
    return {
      level: 1, name: "Getting started",
      additionSubtraction: [0, 10],
      multiplication: [[0, 5], [0, 5]],
      division: { dividend: [0, 25], divisor: [1, 5] },
    };
  } else if (level === 2) {
    return {
      level: 2, name: "Fact builder",
      additionSubtraction: [10, 99],
      multiplication: [[0, 10], [0, 10]],
      division: { dividend: [0, 100], divisor: [2, 10] },
    };
  } else if (level === 3) {
    return {
      level: 3, name: "Number explorer",
      additionSubtraction: [100, 999],
      multiplication: [[10, 99], [2, 9]],
      division: { dividend: [10, 99], divisor: [2, 9] },
    };
  } else if (level === 4) {
    return {
      level: 4, name: "Big number challenge",
      additionSubtraction: [1000, 9999],
      multiplication: [[100, 999], [2, 9]],
      division: { dividend: [100, 999], divisor: [2, 9] },
    };
  } else if (level === 5) {
    return {
      level: 5, name: "Math adventurer",
      additionSubtraction: [10000, 99999],
      multiplication: [[10, 99], [10, 99]],
      division: { dividend: [1000, 9999], divisor: [2, 9] },
    };
  }
  throw new RangeError("Level must be an integer from 1 to 5.");
}

// Default configurations for legacy level-based callers.
export const LEVELS: LevelConfig[] = [];
const levelNumbers: DifficultyLevel[] = [1, 2, 3, 4, 5];
for (const level of levelNumbers) {
  LEVELS.push(getLevelConfig(level));
}


// Optional external configuration lets the adventure model own difficulty rules.
export function resolveLevelConfig(level: DifficultyLevel, configuration?: LevelConfig): LevelConfig {
  const fallback = getLevelConfig(level);
  if (configuration === undefined) return fallback;
  if (!configuration || configuration.level !== level || typeof configuration.name !== "string") {
    throw new RangeError("Configuration must match the requested level.");
  }
  validateRange(configuration.additionSubtraction);
  if (!Array.isArray(configuration.multiplication) || configuration.multiplication.length !== 2) {
    throw new RangeError("Multiplication requires two operand ranges.");
  }
  validateRange(configuration.multiplication[0]);
  validateRange(configuration.multiplication[1]);
  validateRange(configuration.division?.dividend);
  validateRange(configuration.division?.divisor, 1);
  const maxDenominator = configuration.fractionMaxDenominator;
  if (maxDenominator !== undefined &&
      (!Number.isInteger(maxDenominator) || maxDenominator < 2 || maxDenominator > 1000)) {
    throw new RangeError("Maximum denominator must be an integer from 2 to 1000.");
  }
  return configuration;
}
