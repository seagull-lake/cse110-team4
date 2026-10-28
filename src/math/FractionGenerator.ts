import { getDigitRange, randomInteger } from "./NumberGenerator.ts";
import { resolveLevelConfig } from "./LevelConfiguration.ts";
import type { Fraction, FractionRelation, FractionRequest, FractionProblem, FractionGenerationRequest, FractionGameData } from "../interfaces/GameInterfaces.ts";

export function generateFraction(random = Math.random, maxDenominator = 12): Fraction {
  if (!Number.isInteger(maxDenominator) || maxDenominator < 2 || maxDenominator > 1000) {
    throw new RangeError("Maximum denominator must be an integer from 2 to 1000.");
  }
  const denominator = randomInteger(2, maxDenominator, random);
  const numerator = randomInteger(1, denominator - 1, random);
  return { numerator, denominator, value: numerator / denominator };
}

// Return the comparison fraction's relation to the reference using exact cross-products.
export function compareFractions(reference: Fraction, comparison: Fraction): FractionRelation {
  for (const fraction of [reference, comparison]) {
    if (!fraction || !Number.isSafeInteger(fraction.numerator) || fraction.numerator < 0 ||
        !Number.isSafeInteger(fraction.denominator) || fraction.denominator < 1) {
      throw new RangeError("Invalid fraction.");
    }
  }
  const left = BigInt(comparison.numerator) * BigInt(reference.denominator);
  const right = BigInt(reference.numerator) * BigInt(comparison.denominator);
  return left < right ? "lesser" : left > right ? "greater" : "equal to";
}

export function generateFractionProblem(request: FractionRequest, random = Math.random): FractionProblem {
  const config = resolveLevelConfig(request.level, request.configuration);
  const count = request.comparisonCount === undefined ? 3 : request.comparisonCount;
  if (!Number.isInteger(count) || count < 1 || count > 10) {
    throw new RangeError("Comparison count must be an integer from 1 to 10.");
  }
  const max = config.fractionMaxDenominator ?? [5, 8, 12, 16, 20][request.level - 1];
  const reference = generateFraction(random, max);
  const comparisons: Fraction[] = [];
  for (let i = 0; i < count; i++) comparisons.push(generateFraction(random, max));
  return { ...createFractionProblem(reference, comparisons), level: request.level };
}

function createFractionProblem(reference: Fraction, comparisons: Fraction[]): FractionGameData {
  const expression = "Compare with " + reference.numerator + "/" + reference.denominator;
  return {
    game: "fraction",
    kind: "fraction-comparison",
    reference,
    comparisons,
    expression,
    prompt: expression + ": lesser, greater, or equal to?",
    solution: comparisons.map(fraction => compareFractions(reference, fraction)),
  };
}

export function generateDigitFractionProblem(request: FractionGenerationRequest, random = Math.random): FractionGameData {
  const [numeratorMin, numeratorMax] = getDigitRange(request.leftDigits);
  const [denominatorMin, denominatorMax] = getDigitRange(request.rightDigits);
  if (request.leftDigits > request.rightDigits) {
    throw new RangeError("Proper fractions require no more numerator digits than denominator digits.");
  }
  const count = request.comparisonCount === undefined ? 3 : request.comparisonCount;
  if (!Number.isInteger(count) || count < 1 || count > 10) {
    throw new RangeError("Comparison count must be an integer from 1 to 10.");
  }
  function nextFraction(): Fraction {
    const denominator = randomInteger(Math.max(denominatorMin, numeratorMin + 1), denominatorMax, random);
    const numerator = randomInteger(numeratorMin, Math.min(numeratorMax, denominator - 1), random);
    return { numerator, denominator, value: numerator / denominator };
  }
  const reference = nextFraction();
  const comparisons: Fraction[] = [];
  for (let i = 0; i < count; i++) comparisons.push(nextFraction());
  return createFractionProblem(reference, comparisons);
}
