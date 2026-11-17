import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Screen } from "../../types.ts";
import { MainGameProblemGenerator } from "../../problem-engine/MainGameProblemGenerator.ts";
import type { DivisionBoxMethod, SolutionStep } from "../../problem-engine/MainGameProblemGenerator.ts";
import type { SubtractionPage } from "./SolutionScreenModel.ts";
import { SolutionScreenController } from "./SolutionScreenController.ts";

const view = vi.hoisted(() => ({
    onNextStep: () => {},
    onHome: () => {},
    onBackToMap: () => {},
    renderDivision: vi.fn(),
    renderAddition: vi.fn(),
    renderSubtraction: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
}));

vi.mock("./solutionScreenView.ts", () => ({
    SolutionScreenView: class {
        constructor(onNextStep: () => void, onHome: () => void, onBackToMap: () => void) {
            view.onNextStep = onNextStep;
            view.onHome = onHome;
            view.onBackToMap = onBackToMap;
        }
        renderDivision(division: DivisionBoxMethod, count: number) {
            view.renderDivision(division, count);
        }
        renderAddition(step: SolutionStep, page: number, level: number) {
            view.renderAddition(step, page, level);
        }
        renderSubtraction(page: SubtractionPage) {
            view.renderSubtraction(page);
        }
        show() { view.show(); }
        hide() { view.hide(); }
    },
}));

function createDivisionProblem() {
    const values = [892.5 / 900, 21.5 / 90];
    const generator = new MainGameProblemGenerator(() => values.shift()!);
    return generator.generate({ operation: "division", operandDigits: [5, 3] });
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("SolutionScreenController", () => {
    it("ignores Next Step before a problem is set", () => {
        new SolutionScreenController({ switchToScreen: () => {} });
        view.onNextStep();

        expect(view.renderDivision).not.toHaveBeenCalled();
        expect(view.renderAddition).not.toHaveBeenCalled();
        expect(view.renderSubtraction).not.toHaveBeenCalled();
    });

    it("passes the original division solution and first box count to the View", () => {
        const problem = createDivisionProblem();
        const controller = new SolutionScreenController({ switchToScreen: () => {} });
        controller.setProblem(problem, "division", 5);

        expect(view.renderDivision).toHaveBeenCalledExactlyOnceWith(
            problem.solution.steps[0].divisionBoxMethod, 1,
        );
        expect(view.renderAddition).not.toHaveBeenCalled();
        expect(view.renderSubtraction).not.toHaveBeenCalled();
    });

    it("advances division through the callback and stops at the last box", () => {
        const problem = createDivisionProblem();
        const controller = new SolutionScreenController({ switchToScreen: () => {} });
        controller.setProblem(problem, "division", 5);

        view.onNextStep();
        expect(view.renderDivision).toHaveBeenLastCalledWith(
            problem.solution.steps[0].divisionBoxMethod, 2,
        );

        view.onNextStep();
        expect(view.renderDivision).toHaveBeenLastCalledWith(
            problem.solution.steps[0].divisionBoxMethod, 2,
        );
    });

    it("resets progress when a different problem is set", () => {
        const controller = new SolutionScreenController({ switchToScreen: () => {} });
        controller.setProblem(createDivisionProblem(), "division", 5);
        view.onNextStep();

        const problem = new MainGameProblemGenerator(() => 0).generate({
            operation: "division", operandDigits: [2, 1],
        });
        controller.setProblem(problem, "division", 1);

        expect(view.renderDivision).toHaveBeenLastCalledWith(
            problem.solution.steps[0].divisionBoxMethod, 1,
        );
    });

    it("passes addition pages and the selected difficulty to the View", () => {
        const problem = new MainGameProblemGenerator(() => 0).generate({
            operation: "addition", operandDigits: [1, 1],
        });
        const controller = new SolutionScreenController({ switchToScreen: () => {} });
        controller.setProblem(problem, "addition", 3);

        expect(view.renderAddition).toHaveBeenLastCalledWith(problem.solution.steps[0], 0, 3);
        view.onNextStep();
        expect(view.renderAddition).toHaveBeenLastCalledWith(problem.solution.steps[0], 1, 3);
        expect(view.renderDivision).not.toHaveBeenCalled();
    });

    it("advances the subtraction column through the Next Step callback", () => {
        const problem = new MainGameProblemGenerator(() => 0.5).generate({
            operation: "subtraction", operandDigits: [2, 1],
        });
        const controller = new SolutionScreenController({ switchToScreen: () => {} });
        controller.setProblem(problem, "subtraction", 2);

        expect(view.renderSubtraction.mock.calls[0][0].visibleColumnCount).toBe(1);
        view.onNextStep();
        expect(view.renderSubtraction.mock.calls[1][0].visibleColumnCount).toBe(2);
        expect(view.renderSubtraction.mock.calls[1][0].hasNext).toBe(false);
        expect(view.renderDivision).not.toHaveBeenCalled();
    });

    it("navigates Home to the menu and Back to the current operation's map", () => {
        const screens: Screen[] = [];
        const controller = new SolutionScreenController({
            switchToScreen: screen => screens.push(screen),
        });
        controller.setProblem(createDivisionProblem(), "division", 5);

        view.onHome();
        view.onBackToMap();

        expect(screens).toEqual([
            { type: "menu" },
            { type: "adventuremap", topic: "division" },
        ]);
    });

    it("delegates show and hide to the View", () => {
        const controller = new SolutionScreenController({ switchToScreen: () => {} });
        controller.show();
        controller.hide();

        expect(view.show).toHaveBeenCalledTimes(1);
        expect(view.hide).toHaveBeenCalledTimes(1);
    });
});
