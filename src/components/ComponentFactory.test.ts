import { afterAll, expect, it, vi } from "vitest";
import Konva from "konva";
import { createNumberField } from "./ComponentFactory.ts";

vi.spyOn(Konva.Util, "createCanvasElement").mockReturnValue({
    getContext: () => ({ save() {}, restore() {}, measureText: (text: string) => ({ width: text.length * 10 }) }),
} as unknown as HTMLCanvasElement);
afterAll(() => vi.restoreAllMocks());

const field = { y: 20, cellXs: [10, 50, 90], size: { width: 40, height: 44, fontSize: 36 } };
const style = { fill: "#FFFFFF", stroke: "#27695B", strokeWidth: 2, textName: "partial-product" };

it("draws every box and leaves an empty field blank", () => {
    const group = createNumberField(field, "", style);
    expect(group.find<Konva.Rect>("Rect")).toHaveLength(3);
    expect(group.find<Konva.Text>("Text")).toHaveLength(0);
    expect(group.find<Konva.Rect>("Rect")[0]).toMatchObject({ attrs: {
        x: 14, y: 24, width: 32, height: 36, fill: "#FFFFFF", stroke: "#27695B", strokeWidth: 2, cornerRadius: 6,
    } });
});

it("right-aligns short values and preserves zero, minus and text names", () => {
    const short = createNumberField(field, "7", style).find<Konva.Text>("Text");
    expect(short.map(node => [node.x(), node.text(), node.name()])).toEqual([[90, "7", "partial-product"]]);

    const zero = createNumberField(field, "0", style).find<Konva.Text>("Text");
    expect(zero.map(node => node.text())).toEqual(["0"]);

    const negative = createNumberField(field, "-3", style).find<Konva.Text>("Text");
    expect(negative.map(node => [node.x(), node.text()])).toEqual([[50, "−"], [90, "3"]]);
});

it("calls the field callback from each box on click or tap", () => {
    const onClick = vi.fn();
    const boxes = createNumberField(field, "12", style, onClick).find<Konva.Rect>("Rect");
    boxes[0].fire("click");
    boxes[2].fire("tap");
    expect(onClick).toHaveBeenCalledTimes(2);
});
