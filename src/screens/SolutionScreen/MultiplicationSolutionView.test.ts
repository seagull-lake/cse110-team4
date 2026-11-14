import { describe, expect, it } from "vitest";
import { MainGameProblemGenerator } from "../../problem-engine/MainGameProblemGenerator.ts";
import { getMultiplicationDisplay } from "./MultiplicationSolutionView.ts";

function multiplicationRows() {
    const values = [0.97, 0.025];
    const problem = new MainGameProblemGenerator(() => values.shift()!).generate({
        operation: "multiplication", operandDigits: [2, 2],
    });
    const rows = problem.solution.steps[0].multiplicationRows;
    if (!rows) throw new Error("Expected multiplication rows.");
    return { problem, rows };
}

function viewData(finalAnswer?: number) {
    const { problem, rows } = multiplicationRows();
    return {
        multiplicand: problem.operands[0], multiplier: problem.operands[1],
        visibleRows: rows, currentRow: rows[1], finalAnswer,
    };
}

describe("MultiplicationSolutionView", () => {
    it("keeps previous rows and highlights the current row", () => {
        const display = getMultiplicationDisplay(viewData());

        expect(display.rows.map(row => row.isCurrent)).toEqual([false, true]);
        expect(display.rows.map(({ row }) => row.partialProduct)).toEqual([194, 970]);
    });

    it("shows the final answer only when supplied", () => {
        expect(getMultiplicationDisplay(viewData()).finalAnswer).toBeUndefined();
        expect(getMultiplicationDisplay(viewData(1164)).finalAnswer).toBe(1164);
    });
});
