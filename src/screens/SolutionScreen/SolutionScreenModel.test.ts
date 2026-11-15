import { describe, expect, it } from "vitest";
import { MainGameProblemGenerator } from "../../problem-engine/MainGameProblemGenerator.ts";
import { SolutionScreenModel } from "./SolutionScreenModel.ts";

function multiplicationProblem() {
    const randomValues = [0.2972, 0.6234];
    return new MainGameProblemGenerator(() => randomValues.shift()!).generate({
        operation: "multiplication",
        operandDigits: [5, 3],
    });
}

describe("SolutionScreenModel multiplication rows", () => {
    it("reveals one complete row at a time from right to left", () => {
        const model = new SolutionScreenModel(multiplicationProblem());

        expect(model.getOperand()).toEqual([36748, 661]);
        expect(model.getMultiplicationPage().visibleRows.map(row => row.partialProduct)).toEqual([36748]);
        expect(model.getMultiplicationPage().currentRow.multiplierDigit).toBe(1);

        model.nextMultiplicationPage();
        expect(model.getMultiplicationPage().visibleRows.map(row => row.partialProduct))
            .toEqual([36748, 2204880]);
        expect(model.getMultiplicationPage().currentRow.multiplierDigit).toBe(6);

        model.nextMultiplicationPage();
        expect(model.getMultiplicationPage().visibleRows.map(row => row.partialProduct))
            .toEqual([36748, 2204880, 22048800]);
        expect(model.getMultiplicationPage().currentRow.multiplierPlaceValue).toBe(100);
    });

    it("stops at the final row", () => {
        const model = new SolutionScreenModel(multiplicationProblem());

        expect(model.getMultiplicationPage()).toMatchObject({ hasNext: true, finalAnswer: undefined });
        model.nextMultiplicationPage();
        model.nextMultiplicationPage();
        model.nextMultiplicationPage();

        expect(model.getMultiplicationPage()).toMatchObject({ hasNext: false, finalAnswer: 24290428 });
        expect(model.getMultiplicationPage().visibleRows).toHaveLength(3);
    });

    it("rejects multiplication navigation for another operation", () => {
        const addition = new MainGameProblemGenerator(() => 0).generate({
            operation: "addition",
            operandDigits: [1, 1],
        });

        expect(() => new SolutionScreenModel(addition).getMultiplicationPage())
            .toThrow("not multiplication");
    });
});
