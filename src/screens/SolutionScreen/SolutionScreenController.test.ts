import { beforeEach, expect, it, vi } from "vitest";
import { MainGameProblemGenerator } from "../../problem-engine/MainGameProblemGenerator.ts";
import type { Screen } from "../../types.ts";
import { SolutionScreenController } from "./SolutionScreenController.ts";
import { SolutionScreenModel } from "./SolutionScreenModel.ts";

const view = vi.hoisted(() => ({
    next: () => {}, home: () => {}, back: () => {},
    renderMultiplication: vi.fn(), renderDivision: vi.fn(), render: vi.fn(),
}));
vi.mock("./solutionScreenView.ts", () => ({
    SolutionScreenView: class {
        constructor(next: () => void, home: () => void, back: () => void) {
            Object.assign(view, { next, home, back });
        }
        renderMultiplication = view.renderMultiplication;
        renderDivision = view.renderDivision;
        render = view.render;
    },
}));
beforeEach(() => vi.clearAllMocks());

function setup() {
    const screens: Screen[] = [];
    const controller = new SolutionScreenController({ switchToScreen: screen => screens.push(screen) });
    const values = [0.15, 0];
    const problem = new MainGameProblemGenerator(() => values.shift()!).generate({
        operation: "multiplication", operandDigits: [2, 2],
    });
    return { controller, problem, screens };
}

it("renders the first page immediately and advances rows, explanation and final answer together", () => {
    const { controller, problem } = setup();
    const read = vi.spyOn(SolutionScreenModel.prototype, "getCurrentPage");
    controller.setProblem(problem, "multiplication", 2);
    expect(read).toHaveBeenCalledTimes(1);
    read.mockRestore();
    expect(problem.operands).toEqual([23, 10]);
    expect(view.renderMultiplication).toHaveBeenLastCalledWith(2, problem,
        expect.objectContaining({ visibleRows: [problem.solution.steps[0].multiplicationRows?.[0]], finalAnswer: undefined }), "23 × 0 = 0");
    view.next();
    expect(view.renderMultiplication).toHaveBeenLastCalledWith(2, problem,
        expect.objectContaining({ visibleRows: problem.solution.steps[0].multiplicationRows, hasNext: true, finalAnswer: undefined }), "23 × 10 = 230");
    view.next();
    expect(view.renderMultiplication).toHaveBeenLastCalledWith(2, problem,
        expect.objectContaining({ currentRow: undefined, finalAnswer: 230, hasNext: false }), "0 + 230 = 230");
    view.next();
    expect(view.renderMultiplication.mock.lastCall?.[2].finalAnswer).toBe(230);
    controller.setProblem(problem, "multiplication", 2);
    expect(view.renderMultiplication.mock.lastCall?.[2].visibleRows).toHaveLength(1);
});

it("keeps division rendering and navigation", () => {
    const { controller } = setup();
    const problem = new MainGameProblemGenerator(() => 0.7).generate({ operation: "division", operandDigits: [4, 2] });
    const division = problem.solution.steps[0].divisionBoxMethod;
    expect(division?.boxes.length).toBeGreaterThan(1);
    controller.setProblem(problem, "division", 3);
    expect(view.renderDivision).toHaveBeenLastCalledWith(division, 1);
    view.next();
    expect(view.renderDivision).toHaveBeenLastCalledWith(division, 2);
    expect(view.renderMultiplication).not.toHaveBeenCalled();
});

it("routes Home and Back to map using the current topic", () => {
    const { controller, problem, screens } = setup();
    controller.setProblem(problem, "multiplication", 2);
    view.home();
    view.back();
    expect(screens).toEqual([{ type: "menu" }, { type: "adventuremap", topic: "multiplication" }]);
    controller.setProblem(new MainGameProblemGenerator(() => 0.5).generate({ operation: "addition", operandDigits: [2, 1] }), "addition", 1);
    view.back();
    expect(screens.at(-1)).toEqual({ type: "adventuremap", topic: "addition" });
});

it.each(["addition", "subtraction"] as const)("keeps the generic rendering for %s", operation => {
    const { controller } = setup();
    const problem = new MainGameProblemGenerator(() => 0.5).generate({ operation, operandDigits: [2, 1] });
    controller.setProblem(problem, operation, 1);
    view.next();
    expect(view.render).toHaveBeenCalledTimes(2);
    expect(view.render.mock.lastCall?.[0].step).toBe(problem.solution.steps[0]);
    expect(view.renderMultiplication).not.toHaveBeenCalled();
});
