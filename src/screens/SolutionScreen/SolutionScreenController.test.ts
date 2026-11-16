import { beforeEach, expect, it, vi } from "vitest";
import { MainGameProblemGenerator } from "../../problem-engine/MainGameProblemGenerator.ts";
import type { Screen } from "../../types.ts";
import { SolutionScreenController } from "./SolutionScreenController.ts";

const view = vi.hoisted(() => ({
    onNextStep: () => {},
    onHome: () => {},
    onBackToMap: () => {},
    multiplication: vi.fn((..._args: unknown[]) => {}),
    division: vi.fn((..._args: unknown[]) => {}),
    addition: vi.fn((..._args: unknown[]) => {}),
    subtraction: vi.fn((..._args: unknown[]) => {}),
}));

vi.mock("./solutionScreenView.ts", () => ({
    SolutionScreenView: class {
        constructor(onNextStep: () => void, onHome: () => void, onBackToMap: () => void) {
            view.onNextStep = onNextStep;
            view.onHome = onHome;
            view.onBackToMap = onBackToMap;
        }
        renderMultiplication(...args: unknown[]) { view.multiplication(...args); }
        renderDivision(...args: unknown[]) { view.division(...args); }
        renderAddition(...args: unknown[]) { view.addition(...args); }
        renderSubtraction(...args: unknown[]) { view.subtraction(...args); }
    },
}));

beforeEach(() => vi.clearAllMocks());

function multiplicationProblem(rightRandom = 0.2356) {
    const randomValues = [0.15, rightRandom];
    return new MainGameProblemGenerator(() => randomValues.shift()!).generate({
        operation: "multiplication", operandDigits: [2, 3],
    });
}

function setup() {
    const screens: Screen[] = [];
    const controller = new SolutionScreenController({ switchToScreen: screen => screens.push(screen) });
    return { controller, screens };
}

it("shows the first generated row and explanation immediately, then advances one row per click", () => {
    const problem = multiplicationProblem(); // 23 × 312
    const { controller } = setup();
    controller.setProblem(problem, "multiplication", 5);

    expect(view.multiplication).toHaveBeenCalledWith(5, problem, expect.objectContaining({
        visibleRows: [problem.solution.steps[0].multiplicationRows?.[0]], hasNext: true,
    }), "23 × 2 = 46");

    view.onNextStep();
    expect(view.multiplication).toHaveBeenLastCalledWith(5, problem, expect.objectContaining({
        visibleRows: problem.solution.steps[0].multiplicationRows?.slice(0, 2), hasNext: true,
    }), "23 × 10 = 230");

    view.onNextStep();
    expect(view.multiplication).toHaveBeenLastCalledWith(5, problem, expect.objectContaining({
        visibleRows: problem.solution.steps[0].multiplicationRows, finalAnswer: undefined, hasNext: true,
    }), "23 × 300 = 6900");

    view.onNextStep();
    expect(view.multiplication).toHaveBeenLastCalledWith(5, problem, expect.objectContaining({
        currentRow: undefined, finalAnswer: 7176, hasNext: false,
    }), "46 + 230 + 6900 = 7176");
});

it("explains a zero partial product using the generated row", () => {
    const { controller } = setup();
    controller.setProblem(multiplicationProblem(0.003), "multiplication", 5); // 23 × 102
    view.onNextStep();

    expect(view.multiplication.mock.lastCall?.[3]).toBe("23 × 0 = 0");
});

it("opens the newly routed problem from its first page", () => {
    const problem = multiplicationProblem();
    const { controller } = setup();
    controller.setProblem(problem, "multiplication", 5);
    view.onNextStep();
    const nextProblem = multiplicationProblem(0.003); // 23 × 102
    controller.setProblem(nextProblem, "multiplication", 5);

    expect(view.multiplication.mock.lastCall?.[1]).toBe(nextProblem);
    expect(view.multiplication.mock.lastCall?.[3]).toBe("23 × 2 = 46");
    expect(view.multiplication.mock.lastCall?.[2]).toMatchObject({ visibleRows: [nextProblem.solution.steps[0].multiplicationRows?.[0]] });
});

it("routes Home to the menu and Back to the current topic map", () => {
    const { controller, screens } = setup();
    controller.setProblem(multiplicationProblem(), "multiplication", 5);
    view.onHome();
    view.onBackToMap();

    expect(screens).toEqual([{ type: "menu" }, { type: "adventuremap", topic: "multiplication" }]);
});

it("keeps division rendering and advancement", () => {
    const randomValues = [0.5, 0.9];
    const problem = new MainGameProblemGenerator(() => randomValues.shift()!).generate({
        operation: "division", operandDigits: [4, 2],
    });
    const { controller } = setup();
    controller.setProblem(problem, "division", 3);
    expect(view.division).toHaveBeenCalledWith(problem.solution.steps[0].divisionBoxMethod, 1);

    view.onNextStep();
    expect(view.division).toHaveBeenLastCalledWith(problem.solution.steps[0].divisionBoxMethod, 2);
});

it("renders addition columns through the dedicated view, including its full-solution page", () => {
    const problem = new MainGameProblemGenerator(() => 0.5).generate({ operation: "addition", operandDigits: [2, 2] });
    const { controller } = setup();
    controller.setProblem(problem, "addition", 2);
    expect(view.addition).toHaveBeenLastCalledWith(problem.solution.steps[0], 0, 2);

    const columns = problem.solution.steps[0].additionColumns;
    if (!columns) throw new Error("Expected addition columns.");
    for (let index = 0; index < columns.length; index++) view.onNextStep();
    expect(view.addition).toHaveBeenLastCalledWith(problem.solution.steps[0], columns.length, 2);
});

it("renders subtraction columns through the dedicated view and reveals the final answer", () => {
    const problem = new MainGameProblemGenerator(() => 0.5).generate({ operation: "subtraction", operandDigits: [3, 2] });
    const { controller } = setup();
    controller.setProblem(problem, "subtraction", 2);
    expect(view.subtraction).toHaveBeenLastCalledWith(expect.objectContaining({
        top: 550, bottom: 55, visibleColumnCount: 1, finalAnswer: undefined,
    }));

    view.onNextStep();
    view.onNextStep();
    expect(view.subtraction).toHaveBeenLastCalledWith(expect.objectContaining({
        visibleColumnCount: 3, hasNext: false, finalAnswer: 495,
    }));
});
