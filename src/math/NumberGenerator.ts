// Keep sampling independent of game modules, views, storage, and scoring.
export function validateRange(range: unknown, minimum = 0, maximum = 1_000_000): void {
  if (!Array.isArray(range) || range.length !== 2 ||
      ![range[0], range[1]].every(value => Number.isSafeInteger(value) && value >= minimum && value <= maximum) ||
      range[0] > range[1]) {
    throw new RangeError("Expected an inclusive integer range within " + minimum + "–" + maximum + ".");
  }
}
export function randomInteger(min: number, max: number, random: () => number = Math.random): number {
  validateRange([min, max], 0, Number.MAX_SAFE_INTEGER);
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError("Random source must return a finite number in [0, 1).");
  }
  return min + Math.floor(value * (max - min + 1));
}

export const MAX_OPERAND_DIGITS = 15;
export function getDigitRange(digits: number): [number, number] {
  if (!Number.isInteger(digits) || digits < 1 || digits > MAX_OPERAND_DIGITS) {
    throw new RangeError("Digit counts must be integers from 1 to " + MAX_OPERAND_DIGITS + ".");
  }
  return [10 ** (digits - 1), 10 ** digits - 1];
}

export function generateNumberWithDigits(digits: number, random = Math.random): number {
  const [min, max] = getDigitRange(digits);
  return randomInteger(min, max, random);
}
