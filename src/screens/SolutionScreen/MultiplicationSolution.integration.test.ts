import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Konva from "konva";
import { MainGameProblemGenerator } from "../../problem-engine/MainGameProblemGenerator.ts";
import { SolutionScreenController } from "./SolutionScreenController.ts";
import { MainProblemScreenController } from "../MainProblemScreen/MainProblemScreenController.ts";
import { getProblemLayout } from "../MainProblemScreen/MainProblemLayout.ts";
import { ProblemDispatcher } from "../../problem-engine/ProblemDispatcher.ts";
import { MultiplicationDivisionGenerator } from "../../problem-engine/MultiplicationDivisionGenerator.ts";
import type { Screen } from "../../types.ts";

let controller: SolutionScreenController;
let main: MainProblemScreenController | undefined;
const switchToScreen = vi.fn<(screen: Screen) => void>();
beforeEach(() => {
    // Only text measurement needs a canvas substitute; the MVC and Konva nodes are real.
    vi.spyOn(Konva.Util, "createCanvasElement").mockReturnValue({
        getContext: () => ({ save() {}, restore() {}, measureText: (text: string) => ({ width: text.length * 10 }) }),
    } as unknown as HTMLCanvasElement);
    switchToScreen.mockReset();
    controller = new SolutionScreenController({ switchToScreen });
    controller.show();
});
afterEach(() => {
    controller.getView().getGroup().destroy();
    main?.getView().getGroup().destroy();
    main = undefined;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

function problem(left: number, right: number) {
    const digits = [left, right].map(value => String(value).length);
    const random = [left, right].map((value, i) => (value - 10 ** (digits[i] - 1) + 0.01) / (9 * 10 ** (digits[i] - 1)));
    return new MainGameProblemGenerator(() => random.shift() ?? 0).generate({ operation: "multiplication", operandDigits: digits });
}
function nodes(name: string) {
    return controller.getView().getGroup().find<Konva.Text>(name).filter(node => node.isVisible());
}
function click(label: string, group = controller.getView().getGroup()) {
    const button = group.find<Konva.Text>("Text").find(node => node.isVisible() && node.text() === label)?.getParent();
    if (!button) throw new Error(`Missing visible button: ${label}`);
    button.fire("click");
}

it.each([
    [27, 19, ["243", "243270"], "513"],
    [23, 102, ["46", "460", "4602300"], "2346"],
    [12, 5, ["60"], "60"],
] as const)("renders generated %s × %s through real Next Step events", (left, right, pages, answer) => {
    controller.setProblem(problem(left, right), "multiplication", 5);
    for (const partialProducts of pages) {
        expect(nodes(".partial-product").map(node => node.text()).join("")).toBe(partialProducts);
        expect(nodes(".final-answer")).toHaveLength(0);
        click("Next Step");
    }
    expect(nodes(".final-answer").map(node => node.text()).join("")).toBe(answer);
    expect(nodes("Text").some(node => node.text() === "Next Step")).toBe(false);
    expect(nodes(".final-answer").every(node => node.getParent()?.find<Konva.Rect>("Rect").every(box => box.fill() === "#B8E6C7"))).toBe(true);
});

it("replaces the current row's carries instead of leaving old carries visible", () => {
    controller.setProblem(problem(27, 19), "multiplication", 3);
    expect(nodes(".carry-digit").map(node => node.text())).toEqual(["6", "2"]);
    click("Next Step");
    expect(nodes(".carry-digit")).toHaveLength(0);
});

it.each(["Home", "Back to map"] as const)("routes an incorrect game answer through the solution and %s", destination => {
    vi.stubGlobal("window", new EventTarget());
    const generator = new MainGameProblemGenerator(() => 0.5);
    const generated = vi.spyOn(generator, "generate");
    const routes: Screen[] = [];
    main = new MainProblemScreenController({ switchToScreen }, new ProblemDispatcher(generator, new MultiplicationDivisionGenerator()));
    const game = main;
    switchToScreen.mockImplementation(screen => {
        routes.push(screen);
        game.hide();
        controller.hide();
        if (screen.type === "solution") {
            controller.setProblem(screen.problem, screen.topic, screen.difficulty);
            controller.show();
        }
    });
    controller.hide();
    game.setLevel("multiplication", 3);
    game.show();
    const result = generated.mock.results[0];
    if (result?.type !== "return") throw new Error("Expected a generated problem.");
    const layout = getProblemLayout("multiplication", result.value);
    const group = game.getView().getGroup();
    const answerBox = group.find<Konva.Rect>("Rect").find(box => box.y() === layout.answer.y + 4);
    if (!answerBox) throw new Error("Missing answer field.");
    answerBox.fire("click");
    const press = (key: string) => {
        const event = new Event("keydown", { cancelable: true });
        Object.defineProperty(event, "key", { value: key });
        window.dispatchEvent(event);
    };
    press("0");
    click("Submit", group);
    expect(routes).toEqual([]); // Incomplete answers must stay on the problem.
    for (let i = 1; i < String(result.value.answer).length; i++) press("0");
    press("Enter");
    expect(routes).toEqual([{ type: "solution", problem: result.value, topic: "multiplication", difficulty: 3 }]);
    expect(routes[0].type === "solution" && routes[0].problem).toBe(result.value);
    expect(generated).toHaveBeenCalledTimes(1);
    expect(nodes(".partial-product").map(node => node.text()).join("")).toBe("275");
    click("Next Step");
    click("Next Step");
    expect(nodes(".final-answer").map(node => node.text()).join("")).toBe("3025");
    click(destination);
    expect(routes.at(-1)).toEqual(destination === "Home" ? { type: "menu" } : { type: "adventuremap", topic: "multiplication" });
});

it("resets the page, answer and level when another multiplication problem opens", () => {
    controller.setProblem(problem(27, 19), "multiplication", 3);
    click("Next Step");
    click("Next Step");
    controller.setProblem(problem(12, 5), "multiplication", 2);
    expect(nodes(".partial-product").map(node => node.text()).join("")).toBe("60");
    expect(nodes(".final-answer")).toHaveLength(0);
    expect(nodes("Text").some(node => node.text() === "Multiplication – Level 2")).toBe(true);
    click("Next Step");
    expect(nodes(".final-answer").map(node => node.text()).join("")).toBe("60");
});
