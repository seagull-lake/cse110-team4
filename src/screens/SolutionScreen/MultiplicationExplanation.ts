import type { SolutionPage } from "./SolutionScreenModel.ts";

export function getMultiplicationExplanation(
    leftOperand: number,
    page: Extract<SolutionPage, { operation: "multiplication" }>,
): string {
    if (page.currentRow) {
        const { multiplierDigit, multiplierPlaceValue, partialProduct } = page.currentRow;
        return `${leftOperand} × ${multiplierDigit * multiplierPlaceValue} = ${partialProduct}`;
    }

    if (page.finalAnswer !== undefined) {
        if (page.visibleRows.length === 1) return `Final answer: ${page.finalAnswer}`;
        return `${page.visibleRows.map(row => row.partialProduct).join(" + ")} = ${page.finalAnswer}`;
    }

    throw new Error("Multiplication page has no current row or final answer.");
}
