import { describe, it, expect } from "vitest";
import { 
    FractionSortScreenModel, FRACTION_COUNT, CHOICE_COUNT, MAX_DENOMINATOR,POINTS_PER_CORRECT
} from "./FractionSortScreenModel.ts";

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
        expect(model.getRound()).toBe(0);
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
            const main = model.getMainFraction();
            expect(main.denominator).toBeLessThanOrEqual(MAX_DENOMINATOR);
            for (const f of model.getFractions()) {
                expect(f.denominator).toBeGreaterThanOrEqual(2);
                expect(f.denominator).toBeLessThanOrEqual(MAX_DENOMINATOR);
                expect(f.numerator).toBeGreaterThanOrEqual(1);
                expect(f.numerator).toBeLessThan(f.denominator);
                expect(Number.isInteger(f.numerator)).toBe(true);
                expect(Number.isInteger(f.denominator)).toBe(true);
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

describe("Rounds", () => {
    it("newRound increments the round and clears placements", () => {
        const model = new FractionSortScreenModel();
        model.newRound();
        model.setPlacement(0, "lesser");
        model.newRound();
        expect(model.getRound()).toBe(2);
        expect(model.getPlacements()).toEqual(new Array(CHOICE_COUNT).fill(null));
    });

    it("counts remaining (unplaced) fractions", () => {
        const model = new FractionSortScreenModel();
        model.newRound();
        expect(model.getRemainingCount()).toBe(CHOICE_COUNT);
        model.setPlacement(0, "lesser");
        expect(model.getRemainingCount()).toBe(CHOICE_COUNT - 1);
        model.setPlacement(0, null);   // dragged back out
        expect(model.getRemainingCount()).toBe(CHOICE_COUNT);
    });

    it("last placement wins", () => {
        const model = modelWith([1, 2], [1, 3]);   // 1/3 < 1/2
        model.setPlacement(0, "greater");
        model.setPlacement(0, "lesser");
        expect(model.isCorrect(0)).toBe(true);
    });
});

describe("Scoring", () => {
    it("unplaced fractions count as wrong", () => {
        const model = modelWith([1, 2], [1, 3], [3, 4], [3, 6]);
        expect(model.allCorrect()).toBe(false);
        expect(model.submit()).toBe(0);
    });

    it("all correct", () => {
        const model = modelWith([1, 2], [1, 3], [3, 4], [3, 6]);
        model.setPlacement(0, "lesser");
        model.setPlacement(1, "greater");
        model.setPlacement(2, "equal to");
        expect(model.allCorrect()).toBe(true);
        expect(model.submit()).toBe(3 * POINTS_PER_CORRECT);
    });

    it("some wrong: points only for correct ones, score adds up across rounds", () => {
        const model = modelWith([1, 2], [1, 3], [3, 4], [3, 6]);
        model.setPlacement(0, "lesser");    // right
        model.setPlacement(1, "greater");   // right
        model.setPlacement(2, "lesser");    // wrong (equal)
        expect(model.getResults()).toEqual([true, true, false]);
        expect(model.allCorrect()).toBe(false);
        expect(model.submit()).toBe(2 * POINTS_PER_CORRECT);
        expect(model.getScore()).toBe(2 * POINTS_PER_CORRECT);

        model.newRound();                   // score stays, placements reset
        model.submit();
        expect(model.getScore()).toBe(2 * POINTS_PER_CORRECT);
    });

    it("resetGame sets score and round back to 0", () => {
        const model = modelWith([1, 2], [1, 3]);
        model.setPlacement(0, "lesser");
        model.submit();
        model.resetGame();
        expect(model.getScore()).toBe(0);
        expect(model.getRound()).toBe(0);
    });

    it("finishGame reports a new high score only when beaten", () => {
        const model = modelWith([1, 2], [1, 3]);
        const start = model.getHighScore();
        model.setPlacement(0, "lesser");
        model.submit();                                     // score = 50
        const expectNew = model.getScore() > start;
        expect(model.finishGame()).toBe(expectNew);
        expect(model.getHighScore()).toBe(Math.max(start, model.getScore()));
        expect(model.finishGame()).toBe(false);             // same score again isn't "new"
    });
});