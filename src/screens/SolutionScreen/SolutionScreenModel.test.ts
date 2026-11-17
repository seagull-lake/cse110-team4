import { describe, expect, it } from "vitest";
import { MainGameProblemGenerator } from "../../problem-engine/MainGameProblemGenerator.ts";
import { SolutionScreenModel, explainSubtractionColumn } from "./SolutionScreenModel.ts";

function multiplicationProblem() {
    const randomValues = [0.2972, 0.6234];
    return new MainGameProblemGenerator(() => randomValues.shift()!).generate({
        operation: "multiplication",
        operandDigits: [5, 3],
    });
}

describe("SolutionScreenModel multiplication rows", () => {
    it("provides the routed problem and level context", () => {
        const problem = multiplicationProblem();
        const model = new SolutionScreenModel(problem, "multiplication", 5);

        expect(model.getContext()).toEqual({ problem, topic: "multiplication", difficulty: 5 });
    });

    it("reveals one complete row at a time from right to left", () => {
        const model = new SolutionScreenModel(multiplicationProblem(), "multiplication", 5);

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
        const model = new SolutionScreenModel(problem, "multiplication", 5);

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
        const model = new SolutionScreenModel(problem, "multiplication", 1);
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

        expect(() => new SolutionScreenModel(addition, "addition", 1).getMultiplicationPage())
            .toThrow("not multiplication");
    });
});

describe("SolutionScreenModel common page interface", () => {
    it.each(["addition", "subtraction", "multiplication", "division"] as const)(
        "advances %s using only the common interface", operation => {
            const problem = new MainGameProblemGenerator(() => 0.5).generate({ operation, operandDigits: [3, 2] });
            const model = new SolutionScreenModel(problem, operation, 1);
            const step = problem.solution.steps[0];
            const count = step.additionColumns?.length ?? step.subtractionColumns?.length ??
                step.multiplicationRows?.length ?? step.divisionBoxMethod?.boxes.length ?? 0;
            const pageCount = count + (operation === "multiplication" || operation === "addition" ? 1 : 0);
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
        const model = new SolutionScreenModel(multiplicationProblem(), "multiplication", 5);
        model.nextMultiplicationPage();
        expect(model.getCurrentPage()).toEqual(model.getMultiplicationPage());
        model.nextPage();
        expect(model.getMultiplicationPage().visibleRows).toHaveLength(3);
    });
});

/** A solved subtraction problem with these exact numbers, made by the real generator. */
function subtractionProblem(left: number, right: number) {
    // The generator picks each operand as min + floor(random * (max - min + 1))
    const randomValues = [left, right].map(operand => {
        const minimum = 10 ** (String(operand).length - 1);
        return (operand - minimum + 0.5) / (minimum * 9);
    });
    return new MainGameProblemGenerator(() => randomValues.shift()!).generate({
        operation: "subtraction",
        operandDigits: [String(left).length, String(right).length],
    });
}

describe("SolutionScreenModel subtraction columns", () => {
    it("starts with only the ones column revealed", () => {
        const model = new SolutionScreenModel(subtractionProblem(604, 278), "subtraction", 3);

        expect(model.getOperand()).toEqual([604, 278]);
        expect(model.getSubtractionPage()).toMatchObject({
            operation: "subtraction", visibleColumns: [expect.any(Object)], hasNext: true, finalAnswer: undefined,
        });
        expect(model.getSubtractionPage().currentColumn).toMatchObject({ leftDigit: 4, rightDigit: 8, borrowOut: 1, resultDigit: 6 });
    });

    it("reveals one more column on every next step and stops at the last one", () => {
        const model = new SolutionScreenModel(subtractionProblem(604, 278), "subtraction", 3);

        model.nextSubtractionPage();
        expect(model.getSubtractionPage().visibleColumns).toHaveLength(2);
        expect(model.getSubtractionPage().currentColumn).toMatchObject({ borrowIn: 1, borrowOut: 1, resultDigit: 2 });

        model.nextSubtractionPage();
        model.nextSubtractionPage();
        expect(model.getSubtractionPage()).toMatchObject({ hasNext: false, finalAnswer: 326 });
        expect(model.getSubtractionPage().visibleColumns.map(column => column.resultDigit)).toEqual([6, 2, 3]);
    });

    it("puts the larger number on top, so 472 and 546 give 546 − 472 = 74", () => {
        const model = new SolutionScreenModel(subtractionProblem(472, 546), "subtraction", 3);

        expect(model.getOperand()).toEqual([546, 472]);
        model.nextSubtractionPage();
        model.nextSubtractionPage();
        expect(model.getSubtractionPage().finalAnswer).toBe(74);
    });

    it("has a column for every digit, even when the answer is shorter", () => {
        const model = new SolutionScreenModel(subtractionProblem(1000, 999), "subtraction", 3);

        model.nextPage();
        model.nextPage();
        model.nextPage();
        expect(model.getSubtractionPage().visibleColumns.map(column => column.resultDigit)).toEqual([1, 0, 0, 0]);
    });

    it("rejects subtraction navigation for another operation", () => {
        expect(() => new SolutionScreenModel(multiplicationProblem(), "multiplication", 5).getSubtractionPage()).toThrow("not subtraction");
    });
});

describe("explaining a subtraction column", () => {
    const column = (leftDigit: number, rightDigit: number, borrowIn: number, borrowOut: number) => {
        const total = leftDigit - rightDigit - borrowIn + borrowOut * 10;
        return { placeValue: 1, leftDigit, rightDigit, borrowIn, borrowOut, total, resultDigit: total };
    };

    it("just subtracts when nothing is borrowed", () => {
        expect(explainSubtractionColumn(column(9, 3, 0, 0), 0)).toBe("Ones: 9 − 3 = 6");
    });

    it("borrows from the next column when the top digit is smaller", () => {
        expect(explainSubtractionColumn(column(4, 8, 0, 1), 0))
            .toBe("Ones: 4 is smaller than 8, so borrow 1 from the tens. 14 − 8 = 6");
    });

    it("takes off the 1 that was lent to the column before", () => {
        expect(explainSubtractionColumn(column(6, 2, 1, 0), 2))
            .toBe("Hundreds (lent 1 to the tens): 6 − 1 − 2 = 3");
    });

    it("can lend and borrow in the same column", () => {
        expect(explainSubtractionColumn(column(0, 7, 1, 1), 1))
            .toBe("Tens (lent 1 to the ones): 0 − 1 is smaller than 7, so borrow 1 from the hundreds. 10 − 1 − 7 = 2");
    });
});
