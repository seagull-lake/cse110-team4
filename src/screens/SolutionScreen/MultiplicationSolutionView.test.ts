import { afterAll, expect, it, vi } from "vitest";
import Konva from "konva";
import { MainGameProblemGenerator } from "../../problem-engine/MainGameProblemGenerator.ts";
import { SolutionScreenModel } from "./SolutionScreenModel.ts";
import { MultiplicationSolutionView } from "./MultiplicationSolutionView.ts";

// Keep real Konva nodes; only text measurement needs a browser canvas.
vi.spyOn(Konva.Util, "createCanvasElement").mockReturnValue({
    getContext: () => ({ save() {}, restore() {}, measureText: (text: string) => ({ width: text.length * 10 }) }),
} as unknown as HTMLCanvasElement);
afterAll(() => vi.restoreAllMocks());

it.each([[5, 3], [2, 1], [1, 1]])("renders cumulative rows and a separate answer for %j digits", (...operandDigits) => {
    const problem = new MainGameProblemGenerator(() => 0.5).generate({ operation: "multiplication", operandDigits });
    const model = new SolutionScreenModel(problem);
    const view = new MultiplicationSolutionView(() => {}, () => {}, () => {});
    const rows = problem.solution.steps[0].multiplicationRows;
    if (!rows) throw new Error("Expected multiplication rows from the generator.");
    const text = (name: string) => view.getGroup().find<Konva.Text>(`.${name}`).map(node => node.text()).join("");
    const renderPage = () => {
        const page = model.getCurrentPage();
        if (page.operation !== "multiplication") throw new Error("Expected a multiplication page.");
        view.render(1, problem, page, "Example explanation");
    };

    for (let index = 0; index < rows.length; index++) {
        renderPage();
        expect(text("partial-product")).toBe(rows.slice(0, index + 1).map(row => row.partialProduct).join(""));
        expect(text("final-answer")).toBe("");
        expect(view.getGroup().find<Konva.Text>("Text").some(node => node.text() === "Example explanation")).toBe(true);
        model.nextPage();
    }
    renderPage();
    expect(text("partial-product")).toBe(rows.map(row => row.partialProduct).join(""));
    expect(text("final-answer")).toBe(String(problem.solution.finalAnswer));
});
