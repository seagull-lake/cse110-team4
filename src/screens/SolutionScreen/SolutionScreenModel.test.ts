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

describe("SolutionScreenModel common page interface", () => {
    it.each(["addition", "subtraction", "multiplication", "division"] as const)(
        "advances %s using only the common interface", operation => {
            const problem = new MainGameProblemGenerator(() => 0.5).generate({ operation, operandDigits: [3, 2] });
            const model = new SolutionScreenModel(problem);
            const step = problem.solution.steps[0];
            const count = step.additionColumns?.length ?? step.subtractionColumns?.length ??
                step.multiplicationRows?.length ?? step.divisionBoxMethod?.boxes.length ?? 0;
            const pageCount = count + (operation === "multiplication" ? 1 : 0);
            expect(pageCount).toBeGreaterThan(0);
            for (let index = 0; index < pageCount; index++) {
                const page = model.getCurrentPage();
                expect(page.operation).toBe(operation);
                expect(page.hasNext).toBe(index < pageCount - 1);
                expect(page.finalAnswer).toBe(page.hasNext ? undefined : problem.solution.finalAnswer);
                switch (page.operation) {
                    case "addition":
                        expect(page.currentColumn).toBe(step.additionColumns?.[index]);
                        expect(page.visibleColumns).toEqual(step.additionColumns?.slice(0, index + 1));
                        break;
                    case "subtraction":
                        expect(page.currentColumn).toBe(step.subtractionColumns?.[index]);
                        expect(page.visibleColumns).toEqual(step.subtractionColumns?.slice(0, index + 1));
                        break;
                    case "multiplication":
                        expect(page.currentRow).toBe(step.multiplicationRows?.[index]);
                        expect(page.visibleRows).toEqual(step.multiplicationRows?.slice(0, index + 1));
                        break;
                    case "division":
                        expect(page.division).toBe(step.divisionBoxMethod);
                        expect(page.visibleBoxCount).toBe(index + 1);
                        break;
                }
                model.nextPage();
            }
            const finalPage = model.getCurrentPage();
            model.nextPage();
            expect(model.getCurrentPage()).toEqual(finalPage);
        },
    );

    it("keeps operation-specific navigation compatible with common navigation", () => {
        const model = new SolutionScreenModel(multiplicationProblem());
        model.nextMultiplicationPage();
        expect(model.getCurrentPage()).toEqual(model.getMultiplicationPage());
        model.nextPage();
        expect(model.getMultiplicationPage().visibleRows).toHaveLength(3);
    });
});
