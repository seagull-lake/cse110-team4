import { afterAll, expect, it, vi } from "vitest";
import Konva from "konva";
import { getProblemLayout } from "./MainProblemLayout.ts";
import { MainProblemScreenView } from "./MainProblemScreenView.ts";

vi.stubGlobal("window", { addEventListener: vi.fn() });
vi.spyOn(Konva.Util, "createCanvasElement").mockReturnValue({
    getContext: () => ({ save() {}, restore() {}, measureText: (text: string) => ({ width: text.length * 10 }) }),
} as unknown as HTMLCanvasElement);
afterAll(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it("keeps field indexes, active styling and click behavior after hidden carry fields", () => {
    const onFieldClick = vi.fn();
    const view = new MainProblemScreenView(() => {}, () => {}, () => {}, () => {}, () => {}, onFieldClick);
    const layout = getProblemLayout("multiplication", { operands: [47, 12], answer: 564 });
    if (layout.kind !== "column") throw new Error("Expected a column layout.");
    const fields = [...layout.steps, layout.answer];
    const index = fields.findIndex(field => field.carry && field.row === 1);
    expect(index).toBeGreaterThan(0);
    view.setProblem(layout);
    view.showAnswer(fields.map(() => ""), index);

    const answerGroup = view.getGroup().getChildren()[2];
    if (!(answerGroup instanceof Konva.Group)) throw new Error("Expected answer group.");
    const boxAt = (fieldIndex: number) => answerGroup.find<Konva.Rect>("Rect").find(box =>
        box.x() === fields[fieldIndex].cellXs[0] + 4 && box.y() === fields[fieldIndex].y + 4);
    const activeBox = boxAt(index);
    if (!activeBox) throw new Error("Expected active box.");
    expect(activeBox.stroke()).toBe("#E0A100");
    expect(activeBox.strokeWidth()).toBe(4);
    activeBox.fire("click");
    activeBox.fire("tap");
    expect(onFieldClick).toHaveBeenNthCalledWith(1, index);
    expect(onFieldClick).toHaveBeenNthCalledWith(2, index);

    vi.stubGlobal("document", { body: { style: { cursor: "default" } } });
    activeBox.fire("mouseenter");
    expect(document.body.style.cursor).toBe("text");
    activeBox.fire("mouseleave");
    expect(document.body.style.cursor).toBe("default");

    view.showCorrectAnswer();
    const finalBox = boxAt(fields.length - 1);
    if (!finalBox) throw new Error("Expected final answer box.");
    expect(finalBox.fill()).toBe("#B8E6C7");
    finalBox.fire("click");
    expect(onFieldClick).toHaveBeenCalledTimes(2);
});
