import { describe, it, expect } from "vitest";
import { FractionSortScreenModel, FRACTION_COUNT, MAX_DENOMINATOR } from "./FractionSortScreenModel.ts";

describe("FractionSortScreenModel", () => {
    it("starts with no fractions and a score of 0", () => {
        const model = new FractionSortScreenModel();
        expect(model.getFractions()).toEqual([]);
        expect(model.getScore()).toBe(0);
    });

    it("generates 1 main fraction + 10 choices", () => {
        const model = new FractionSortScreenModel();
        model.generateFractions();
        expect(model.getFractions()).toHaveLength(FRACTION_COUNT);
        expect(model.getChoiceFractions()).toHaveLength(FRACTION_COUNT - 1);
    });

    // Random output → check the rules hold over many runs
    it("always makes valid proper fractions", () => {
        const model = new FractionSortScreenModel();
        for (let run = 0; run < 1000; run++) {
            model.generateFractions();
            for (const f of model.getFractions()) {
                expect(Number.isInteger(f.numerator)).toBe(true);
                expect(Number.isInteger(f.denominator)).toBe(true);
                expect(f.denominator).toBeGreaterThanOrEqual(2);
                expect(f.denominator).toBeLessThanOrEqual(MAX_DENOMINATOR);
                expect(f.numerator).toBeGreaterThanOrEqual(1);
                expect(f.numerator).toBeLessThan(f.denominator);
                expect(f.value).toBeCloseTo(f.numerator / f.denominator);
            }
        }
    });

    // Fake random → exact, predictable output
    it("uses the random source to pick numbers", () => {
        const model = new FractionSortScreenModel(() => 0); // always the minimum
        model.generateFractions();
        expect(model.getMainFraction()).toEqual({ numerator: 1, denominator: 2, value: 0.5 });
    });

    it("handles the largest possible random value", () => {
        const model = new FractionSortScreenModel(() => 0.9999); // always the maximum
        model.generateFractions();
        expect(model.getMainFraction()).toEqual({
            numerator: MAX_DENOMINATOR - 1,
            denominator: MAX_DENOMINATOR,
            value: (MAX_DENOMINATOR - 1) / MAX_DENOMINATOR,
        });
    });

    it("replaces old fractions instead of appending", () => {
        const model = new FractionSortScreenModel();
        model.generateFractions();
        model.generateFractions();
        expect(model.getFractions()).toHaveLength(FRACTION_COUNT);
    });

    it("returns a copy so callers can't change the model", () => {
        const model = new FractionSortScreenModel();
        model.generateFractions();
        model.getFractions().pop();
        expect(model.getFractions()).toHaveLength(FRACTION_COUNT);
    });
});
