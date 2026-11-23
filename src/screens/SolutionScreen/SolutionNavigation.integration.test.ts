import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Konva from "konva";
import type { Screen } from "../../types.ts";
import { MainGameProblemGenerator } from "../../problem-engine/MainGameProblemGenerator.ts";
import { STAGE_HEIGHT, STAGE_WIDTH } from "../../constants.ts";
import { SolutionScreenController } from "./SolutionScreenController.ts";
import { FINAL_ANSWER_FILL } from "../../components/ComponentFactory.ts";
import { solvedDivision, solvedProblem } from "../MainProblemScreen/testProblems.ts";

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
function click(label: string, event: "click" | "tap" = "click"): void {
    const text = controller.getView().getGroup().find<Konva.Text>("Text")
        .find(node => node.text() === label && node.isVisible());
    if (!text) throw new Error(`No "${label}" button is shown.`);
    text.getParent()?.fire(event);
}

function labels(): string[] {
    return controller.getView().getGroup().find<Konva.Text>("Text")
        .filter(node => node.isVisible()).map(node => node.text());
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
        let pages = 1;
        while (labels().includes("Next Step →")) {
            click("Next Step →");
            expect(++pages).toBeLessThan(20);
        }
        expect(labels()).toContain("Try Again");
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
    const nextButton = () => controller.getView().getGroup().find<Konva.Group>(".next-step-button")
        .filter(node => node.isVisible());

    const cases = (Object.keys(allProblems) as (keyof typeof allProblems)[])
        .flatMap(topic => [1, 3, 5].map(difficulty => [topic, difficulty] as const));

    it.each(cases)(
        "%s level %s: Next Step reveals the solution, then Try Again reopens the same level", (topic, difficulty) => {
            controller.setProblem(allProblems[topic](), topic, difficulty);
            let pages = 1;
            while (labels().includes("Next Step →")) {
                expect(labels()).toEqual(expect.arrayContaining(["Home", "Back to map"]));
                expect(nextButton()).toHaveLength(1);
                expect(nextButton()[0].position()).toEqual({ x: STAGE_WIDTH - 190, y: STAGE_HEIGHT - 62 });
                expect(labels()).not.toContain("Try Again");
                click("Next Step →");
                expect(screens).toEqual([]);
                expect(++pages).toBeLessThan(20);
            }
            expect(labels()).toEqual(expect.arrayContaining(["Home", "Back to map", "Try Again"]));
            expect(labels()).not.toContain("Completed");
            expect(nextButton()).toHaveLength(1);
            expect(nextButton()[0].position()).toEqual({ x: STAGE_WIDTH - 190, y: STAGE_HEIGHT - 62 });
            expect(nextButton()[0].findOne<Konva.Rect>("Rect")?.opacity()).toBe(1);
            click("Try Again", difficulty === 3 ? "tap" : "click");
            expect(screens).toEqual([{ type: "mainproblem", topic, difficulty }]);
        });
});

describe("the last page highlights the answer", () => {
    const solved = {
        // 642 + 677 = 1319 (a carry into a new digit) and 123 + 456 = 579 (no carry out: no leading 0 box)
        addition: [solvedProblem("addition", 642, 677), solvedProblem("addition", 123, 456)],
        subtraction: [solvedProblem("subtraction", 604, 278), solvedProblem("subtraction", 1000, 999)],
        multiplication: [solvedProblem("multiplication", 47, 23)],
        division: [solvedDivision(96, 4), solvedDivision(4738, 23)],
    } as const;
    const greenBoxes = () => controller.getView().getGroup().find<Konva.Rect>("Rect")
        .filter(rect => rect.isVisible() && rect.fill() === FINAL_ANSWER_FILL);
    const texts = () => controller.getView().getGroup().find<Konva.Text>("Text")
        .filter(node => node.isVisible()).map(node => node.text());

    it.each((Object.keys(solved) as (keyof typeof solved)[])
        .flatMap(topic => solved[topic].map(problem => [topic, problem] as const)))(
        "%s: green answer boxes only on the last page", (topic, problem) => {
            controller.setProblem(problem, topic, 3);
            while (texts().includes("Next Step →")) {
                expect(greenBoxes()).toHaveLength(0);
                click("Next Step →");
            }
            // One green box per digit of the answer
            expect(greenBoxes()).toHaveLength(String(problem.answer).length);
        });

    it("writes the whole sum on addition's Full Solution page, without a leading 0", () => {
        controller.setProblem(solvedProblem("addition", 123, 456), "addition", 3);
        while (texts().includes("Next Step →")) click("Next Step →");
        expect(texts()).toContain("123 + 456 = 579");
        // The three 0s are the carry boxes (nothing carries); the answer row has no leading 0
        expect(texts().filter(text => text === "0")).toHaveLength(3);
    });
});
