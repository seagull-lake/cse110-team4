import { afterAll, expect, it, vi } from "vitest";
import Konva from "konva";
import { MainGameProblemGenerator } from "../../problem-engine/MainGameProblemGenerator.ts";
import { SolutionScreenModel } from "./SolutionScreenModel.ts";
import { SolutionScreenView } from "./solutionScreenView.ts";

vi.spyOn(Konva.Util, "createCanvasElement").mockReturnValue({
    getContext: () => ({ save() {}, restore() {}, measureText: (text: string) => ({ width: text.length * 10 }) }),
} as unknown as HTMLCanvasElement);
afterAll(() => vi.restoreAllMocks());

it("reuses operation groups across renders and forwards multiplication callbacks", () => {
    const onNext = vi.fn();
    const onHome = vi.fn();
    const onBack = vi.fn();
    const view = new SolutionScreenView(onNext, onHome, onBack);
    const problem = new MainGameProblemGenerator(() => 0.5).generate({
        operation: "multiplication", operandDigits: [2, 2],
    });
    const page = new SolutionScreenModel(problem, "multiplication", 3).getMultiplicationPage();
    const content = view.getGroup().getChildren()[0];
    if (!(content instanceof Konva.Group)) throw new Error("Expected content group.");

    view.renderMultiplication(3, problem, page, "First product");
    const multiplicationGroup = content.getChildren()[0];
    if (!(multiplicationGroup instanceof Konva.Group)) throw new Error("Expected multiplication group.");
    const button = (label: string) => multiplicationGroup.find<Konva.Text>("Text")
        .find(node => node.text() === label)?.getParent();
    button("Next Step")?.fire("click");
    button("Home")?.fire("click");
    button("Back to map")?.fire("click");
    expect(onNext).toHaveBeenCalledOnce();
    expect(onHome).toHaveBeenCalledOnce();
    expect(onBack).toHaveBeenCalledOnce();

    const division = new MainGameProblemGenerator(() => 0.5).generate({
        operation: "division", operandDigits: [4, 2],
    }).solution.steps[0].divisionBoxMethod;
    if (!division) throw new Error("Expected division boxes.");
    view.renderDivision(division, 1);
    expect(multiplicationGroup.getParent()).toBeNull();
    const divisionGroup = content.getChildren()[0];

    view.renderMultiplication(3, problem, page, "First product");
    expect(content.getChildren()[0]).toBe(multiplicationGroup);
    expect(divisionGroup.getParent()).toBeNull();

    view.show();
    expect(view.getGroup().visible()).toBe(true);
    view.hide();
    expect(view.getGroup().visible()).toBe(false);
});
