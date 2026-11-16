import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Konva from "konva";
import { MainGameProblemGenerator } from "../../problem-engine/MainGameProblemGenerator.ts";
import { SolutionScreenController } from "./SolutionScreenController.ts";

let controller: SolutionScreenController;
beforeEach(() => {
    // Only text measurement needs a canvas substitute; the MVC and Konva nodes are real.
    vi.spyOn(Konva.Util, "createCanvasElement").mockReturnValue({
        getContext: () => ({ save() {}, restore() {}, measureText: (text: string) => ({ width: text.length * 10 }) }),
    } as unknown as HTMLCanvasElement);
    controller = new SolutionScreenController({ switchToScreen: vi.fn() });
    controller.show();
});
afterEach(() => {
    controller.getView().getGroup().destroy();
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
function click(label: string) {
    const button = nodes("Text").find(node => node.text() === label)?.getParent();
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
