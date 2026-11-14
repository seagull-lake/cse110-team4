import { expect, it } from "vitest";
import { MainGameProblemGenerator } from "../../problem-engine/MainGameProblemGenerator.ts";
import { SolutionScreenModel } from "./SolutionScreenModel.ts";
import { getMultiplicationExplanation } from "./MultiplicationExplanation.ts";

function modelFor(rightRandom: number, rightDigits: number): SolutionScreenModel {
    const randomValues = [0.15, rightRandom];
    const problem = new MainGameProblemGenerator(() => randomValues.shift()!).generate({
        operation: "multiplication", operandDigits: [2, rightDigits],
    });
    expect(problem.operands[0]).toBe(23);
    return new SolutionScreenModel(problem);
}

it.each([
    [0, "23 × 2 = 46"],
    [1, "23 × 10 = 230"],
    [2, "23 × 300 = 6900"],
])("explains partial product page %i", (pageIndex, expected) => {
    const model = modelFor(0.2356, 3); // 23 × 312
    for (let index = 0; index < pageIndex; index++) model.nextPage();

    expect(getMultiplicationExplanation(23, model.getMultiplicationPage())).toBe(expected);
});

it("explains a zero digit in the multiplier", () => {
    const model = modelFor(0.003, 3); // 23 × 102
    model.nextPage();

    expect(getMultiplicationExplanation(23, model.getMultiplicationPage())).toBe("23 × 0 = 0");
});

it("uses the recorded partial product without recalculating it", () => {
    const page = modelFor(0.2356, 3).getMultiplicationPage();
    if (!page.currentRow) throw new Error("Expected a partial-product page.");
    const recordedPage = { ...page, currentRow: { ...page.currentRow, partialProduct: 47 } };

    expect(getMultiplicationExplanation(23, recordedPage)).toBe("23 × 2 = 47");
});

it("joins the generated partial products on the final page", () => {
    const model = modelFor(0.2356, 3); // 23 × 312
    for (let index = 0; index < 3; index++) model.nextPage();

    expect(getMultiplicationExplanation(23, model.getMultiplicationPage())).toBe("46 + 230 + 6900 = 7176");
});

it("uses a short final explanation for a one-digit multiplier", () => {
    const model = modelFor(0.5, 1); // 23 × 5
    model.nextPage();

    expect(getMultiplicationExplanation(23, model.getMultiplicationPage())).toBe("Final answer: 115");
});

it("keeps a zero final answer rather than treating it as absent", () => {
    const model = modelFor(0.2356, 3);
    for (let index = 0; index < 3; index++) model.nextPage();
    const finalPage = { ...model.getMultiplicationPage(), finalAnswer: 0 };

    expect(getMultiplicationExplanation(23, finalPage)).toBe("46 + 230 + 6900 = 0");
});
