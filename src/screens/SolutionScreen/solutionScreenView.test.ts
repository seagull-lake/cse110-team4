import { expect, it, vi } from "vitest";
import Konva from "konva";
import { MainGameProblemGenerator } from "../../problem-engine/MainGameProblemGenerator.ts";
import { SolutionScreenModel } from "./SolutionScreenModel.ts";
import { SolutionScreenView } from "./solutionScreenView.ts";

const callbacks = vi.hoisted(() => [] as Array<() => void>);
vi.mock("./MultiplicationSolutionView.ts", () => ({
    MultiplicationSolutionView: class {
        group = new Konva.Group({ name: "multiplication" });
        constructor(home: () => void, back: () => void, next: () => void) { callbacks.splice(0, 3, home, back, next); }
        getGroup() { return this.group; }
        render = vi.fn();
    },
}));
vi.mock("./DivisionSolutionView.ts", () => ({
    DivisionSolutionView: class {
        group = new Konva.Group({ name: "division" });
        getGroup() { return this.group; }
        render = vi.fn();
    },
}));

it("reuses operation groups across rendering, show/hide and reopening", () => {
    const next = vi.fn(), home = vi.fn(), back = vi.fn();
    const view = new SolutionScreenView(next, home, back);
    const problem = new MainGameProblemGenerator(() => 0.5).generate({ operation: "multiplication", operandDigits: [2, 2] });
    const page = new SolutionScreenModel(problem).getMultiplicationPage();
    view.renderMultiplication(1, problem, page, "Example");
    const multiplication = view.getGroup().findOne(".multiplication");
    if (!multiplication) throw new Error("Expected multiplication group.");
    const destroy = vi.spyOn(multiplication, "destroy");
    const division = new MainGameProblemGenerator(() => 0.7).generate({ operation: "division", operandDigits: [4, 2] }).solution.steps[0].divisionBoxMethod;
    if (!division) throw new Error("Expected division data.");
    view.renderDivision(division, 1);
    const divisionGroup = view.getGroup().findOne(".division");
    view.render({ step: problem.solution.steps[0], currentColumn: undefined, visibleColumns: [], hasNextColumn: false });
    view.renderMultiplication(1, problem, page, "Again");
    expect(view.getGroup().findOne(".multiplication")).toBe(multiplication);
    expect(destroy).not.toHaveBeenCalled();
    view.renderDivision(division, 1);
    expect(view.getGroup().findOne(".division")).toBe(divisionGroup);
    view.show();
    expect(view.getGroup().visible()).toBe(true);
    view.hide();
    expect(view.getGroup().visible()).toBe(false);
    callbacks.forEach(callback => callback());
    expect(home).toHaveBeenCalledOnce();
    expect(back).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledOnce();
});
