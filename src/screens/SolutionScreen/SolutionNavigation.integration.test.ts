import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Konva from "konva";
import type { Screen } from "../../types.ts";
import { MainGameProblemGenerator } from "../../problem-engine/MainGameProblemGenerator.ts";
import { STAGE_HEIGHT, STAGE_WIDTH } from "../../constants.ts";
import { SolutionScreenController } from "./SolutionScreenController.ts";

let controller: SolutionScreenController;
let screens: Screen[];
beforeEach(() => {
    // Only text measurement needs a canvas substitute; the MVC and Konva nodes are real.
    vi.spyOn(Konva.Util, "createCanvasElement").mockReturnValue({
        getContext: () => ({ save() {}, restore() {}, measureText: (text: string) => ({ width: text.length * 10 }) }),
    } as unknown as HTMLCanvasElement);
    screens = [];
    controller = new SolutionScreenController({ switchToScreen: screen => screens.push(screen) });
    controller.show();
});
afterEach(() => {
    controller.getView().getGroup().destroy();
    vi.restoreAllMocks();
});

/** Clicks the visible button with this label. */
function click(label: string): void {
    const text = controller.getView().getGroup().find<Konva.Text>("Text")
        .find(node => node.text() === label && node.isVisible());
    if (!text) throw new Error(`No "${label}" button is shown.`);
    text.getParent()?.fire("click");
}

const problems = {
    subtraction: () => new MainGameProblemGenerator(() => 0.5).generate({ operation: "subtraction", operandDigits: [3, 3] }),
    division: () => new MainGameProblemGenerator(() => 0.5).generate({ operation: "division", operandDigits: [3, 1] }),
} as const;

describe.each(Object.keys(problems) as (keyof typeof problems)[])("the %s solution", topic => {
    it("goes back to the topic's map", () => {
        controller.setProblem(problems[topic](), topic, 3);
        click("Back to map");
        expect(screens).toEqual([{ type: "adventuremap", topic }]);
    });

    it("goes home", () => {
        controller.setProblem(problems[topic](), topic, 3);
        click("Home");
        expect(screens).toEqual([{ type: "menu" }]);
    });

    it("can still leave after the last step", () => {
        controller.setProblem(problems[topic](), topic, 3);
        for (let step = 0; step < 10; step++) {
            try { click("Next Step →"); } catch { break; }
        }
        click("Back to map");
        expect(screens).toEqual([{ type: "adventuremap", topic }]);
    });
});

describe("every solution screen has the same buttons", () => {
    const allProblems = {
        addition: () => new MainGameProblemGenerator(() => 0.5).generate({ operation: "addition", operandDigits: [3, 3] }),
        subtraction: problems.subtraction,
        multiplication: () => new MainGameProblemGenerator(() => 0.5).generate({ operation: "multiplication", operandDigits: [2, 2] }),
        division: problems.division,
    } as const;
    /** The labels of the visible buttons. */
    const labels = () => controller.getView().getGroup().find<Konva.Text>("Text")
        .filter(node => node.isVisible()).map(node => node.text());
    const nextButton = () => controller.getView().getGroup().find<Konva.Group>(".next-step-button")
        .filter(node => node.isVisible());

    it.each(Object.keys(allProblems) as (keyof typeof allProblems)[])(
        "%s: Home and Back to map on every page, Next Step until the end, then Completed", topic => {
            controller.setProblem(allProblems[topic](), topic, 3);
            let pages = 1;
            while (labels().includes("Next Step →")) {
                expect(labels()).toEqual(expect.arrayContaining(["Home", "Back to map"]));
                expect(nextButton()).toHaveLength(1);
                expect(nextButton()[0].position()).toEqual({ x: STAGE_WIDTH - 190, y: STAGE_HEIGHT - 62 });
                click("Next Step →");
                expect(++pages).toBeLessThan(20);
            }
            expect(labels()).toEqual(expect.arrayContaining(["Home", "Back to map", "Completed"]));
            expect(nextButton()).toHaveLength(1);
            expect(nextButton()[0].position()).toEqual({ x: STAGE_WIDTH - 190, y: STAGE_HEIGHT - 62 });
            // Completed does nothing; Back to map still leaves
            click("Completed");
            expect(screens).toEqual([]);
            click("Back to map");
            expect(screens).toEqual([{ type: "adventuremap", topic }]);
        });
});
