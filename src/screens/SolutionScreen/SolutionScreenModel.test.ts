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
        expect(model.getMultiplicationPage().currentRow?.multiplierDigit).toBe(1);

        model.nextMultiplicationPage();
        expect(model.getMultiplicationPage().visibleRows.map(row => row.partialProduct))
            .toEqual([36748, 2204880]);
        expect(model.getMultiplicationPage().currentRow?.multiplierDigit).toBe(6);

        model.nextMultiplicationPage();
        expect(model.getMultiplicationPage().visibleRows.map(row => row.partialProduct))
            .toEqual([36748, 2204880, 22048800]);
        expect(model.getMultiplicationPage().currentRow?.multiplierPlaceValue).toBe(100);
    });

    it("shows the final answer on a separate page and stops there", () => {
        const problem = multiplicationProblem();
        const model = new SolutionScreenModel(problem);

        expect(model.getMultiplicationPage()).toMatchObject({ hasNext: true, finalAnswer: undefined });
        model.nextMultiplicationPage();
        model.nextMultiplicationPage();
        expect(model.getMultiplicationPage()).toMatchObject({ hasNext: true, finalAnswer: undefined });
        expect(model.getMultiplicationPage().currentRow).toBe(problem.solution.steps[0].multiplicationRows?.[2]);
        model.nextMultiplicationPage();

        expect(model.getMultiplicationPage()).toMatchObject({ hasNext: false, finalAnswer: 24290428, currentRow: undefined });
        expect(model.getMultiplicationPage().visibleRows).toHaveLength(3);
        const finalPage = model.getMultiplicationPage();
        model.nextMultiplicationPage();
        expect(model.getMultiplicationPage()).toEqual(finalPage);
    });

    it("also needs a final page for a one-digit multiplier", () => {
        const problem = new MainGameProblemGenerator(() => 0.5).generate({
            operation: "multiplication", operandDigits: [2, 1],
        });
        const model = new SolutionScreenModel(problem);
        expect(model.getMultiplicationPage().visibleRows[0]).toBe(problem.solution.steps[0].multiplicationRows?.[0]);
        expect(model.getMultiplicationPage()).toMatchObject({ hasNext: true, finalAnswer: undefined });
        model.nextMultiplicationPage();
        expect(model.getMultiplicationPage()).toMatchObject({ hasNext: false, currentRow: undefined, finalAnswer: problem.solution.finalAnswer });
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
