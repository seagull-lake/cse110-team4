import { describe, it, expect } from "vitest";
import { FractionSortScreenModel, FRACTION_COUNT, CHOICE_COUNT, MAX_DENOMINATOR } from "./FractionSortScreenModel.ts";

// Build a model whose fractions are set by hand (main first), for exact answer tests
function modelWith(...fracs: [number, number][]): FractionSortScreenModel {
    const model = new FractionSortScreenModel();
    model.newRound();
    const all = model.getFractions();   // copy; we overwrite the internal list below
    fracs.forEach(([n, d], i) => { all[i] = { numerator: n, denominator: d, value: n / d }; });
    (model as unknown as { fractions: unknown }).fractions = all;
    return model;
}

describe("Fraction generator", () => {
    it("starts with no fractions and a score of 0", () => {
        const model = new FractionSortScreenModel();
        expect(model.getFractions()).toEqual([]);
        expect(model.getScore()).toBe(0);
    });

    it("generates 1 main fraction + 10 choices", () => {
        const model = new FractionSortScreenModel();
        model.generateFractions();
        expect(model.getFractions()).toHaveLength(FRACTION_COUNT);
        expect(model.getChoiceFractions()).toHaveLength(CHOICE_COUNT);
    });

    it("always makes valid proper fractions", () => {
        const model = new FractionSortScreenModel();
        for (let run = 0; run < 1000; run++) {
            model.generateFractions();
            for (const f of model.getFractions()) {
                expect(f.denominator).toBeGreaterThanOrEqual(2);
                expect(f.denominator).toBeLessThanOrEqual(MAX_DENOMINATOR);
                expect(f.numerator).toBeGreaterThanOrEqual(1);
                expect(f.numerator).toBeLessThan(f.denominator);
                expect(f.value).toBeCloseTo(f.numerator / f.denominator);
            }
        }
    });

    it("uses the random source (min and max)", () => {
        const low = new FractionSortScreenModel(() => 0);
        low.generateFractions();
        expect(low.getMainFraction()).toEqual({ numerator: 1, denominator: 2, value: 0.5 });

        const high = new FractionSortScreenModel(() => 0.9999);
        high.generateFractions();
        expect(high.getMainFraction().denominator).toBe(MAX_DENOMINATOR);
        expect(high.getMainFraction().numerator).toBe(MAX_DENOMINATOR - 1);
    });
});

describe("Answer checker", () => {
    // main = 1/2, choices: 1/3 (lesser), 3/4 (greater), 2/4 (equal)
    const model = modelWith([1, 2], [1, 3], [3, 4], [2, 4]);

    it("lesser", () => {
        expect(model.checkPlacement(0, "lesser")).toBe(true);
        expect(model.checkPlacement(0, "greater")).toBe(false);
        expect(model.checkPlacement(0, "equal to")).toBe(false);
    });

    it("greater", () => {
        expect(model.checkPlacement(1, "greater")).toBe(true);
        expect(model.checkPlacement(1, "lesser")).toBe(false);
    });

    it("equal (different numbers, same value)", () => {
        expect(model.checkPlacement(2, "equal to")).toBe(true);
        expect(model.checkPlacement(2, "lesser")).toBe(false);
        expect(model.checkPlacement(2, "greater")).toBe(false);
    });

    it("invalid index is just wrong, not a crash", () => {
        expect(model.checkPlacement(99, "lesser")).toBe(false);
    });
});

describe("Round + submit", () => {
    it("newRound clears placements", () => {
        const model = new FractionSortScreenModel();
        model.newRound();
        model.setPlacement(0, "lesser");
        model.newRound();
        expect(model.getPlacements()).toEqual(new Array(CHOICE_COUNT).fill(null));
    });

    it("unplaced fractions count as wrong", () => {
        const model = modelWith([1, 2], [1, 3]);
        expect(model.isCorrect(0)).toBe(false);
        expect(model.submit()).toBe(0);
    });

    it("last placement wins", () => {
        const model = modelWith([1, 2], [1, 3]);   // 1/3 < 1/2
        model.setPlacement(0, "greater");
        model.setPlacement(0, "lesser");
        expect(model.isCorrect(0)).toBe(true);
    });

    it("submit counts correct answers and adds to score across rounds", () => {
        const model = modelWith([1, 2], [1, 3], [3, 4], [2, 4]);
        model.setPlacement(0, "lesser");    // right
        model.setPlacement(1, "greater");   // right
        model.setPlacement(2, "lesser");    // wrong (equal)
        expect(model.getResults().slice(0, 3)).toEqual([true, true, false]);
        expect(model.submit()).toBe(2);
        expect(model.getScore()).toBe(2);

        model.newRound();                   // score stays, placements reset
        expect(model.getScore()).toBe(2);
        expect(model.submit()).toBe(0);
        expect(model.getScore()).toBe(2);
    });

    it("resetScore sets score back to 0", () => {
        const model = modelWith([1, 2], [1, 3]);
        model.setPlacement(0, "lesser");
        model.submit();
        model.resetScore();
        expect(model.getScore()).toBe(0);
    });
});