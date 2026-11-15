import { describe, expect, it, vi } from "vitest";
import { MainGameProblemGenerator } from "../../problem-engine/MainGameProblemGenerator.ts";
import { SolutionScreenController } from "./SolutionScreenController.ts";
import { SolutionScreenModel } from "./SolutionScreenModel.ts";

// Record drawing commands and clicks without requiring a browser canvas.
vi.mock("konva", () => {
    class Node {
        attrs: Record<string, any>;
        children: Node[] = [];
        events: Record<string, () => void> = {};
        constructor(attrs = {}) { this.attrs = attrs; }
        add(child: Node) { this.children.push(child); }
        destroyChildren() { this.children = []; }
        removeChildren() { this.children = []; }
        getLayer() { return undefined; }
        on(event: string, callback: () => void) { this.events[event] = callback; }
    }
    return { default: { Group: Node, Rect: Node, Text: Node, Line: Node } };
});

interface Drawing {
    attrs: Record<string, any>;
    children: Drawing[];
    events: Record<string, () => void>;
}

// Generate the same two-box problem as the screenshot using the real generator.
function exampleProblem() {
    const values = [892.5 / 900, 21.5 / 90];
    return new MainGameProblemGenerator(() => values.shift()!).generate({
        operation: "division", operandDigits: [5, 3],
    });
}

// Read the digit text drawn on one row within a single box.
function readRow(diagram: Drawing, box: number, y: number): string {
    const left = 98 + box * 196;
    return diagram.children.filter(node =>
        /^\d$/.test(node.attrs.text ?? "") && node.attrs.y === y
        && node.attrs.x >= left && node.attrs.x < left + 196,
    ).map(node => node.attrs.text).join("");
}

describe("division box navigation", () => {
    it("reveals boxes one at a time and shows the final answer only on completion", () => {
        const similar = vi.fn();
        const controller = new SolutionScreenController(exampleProblem(), similar);
        const screen = controller.getView().getGroup() as unknown as Drawing;
        const root = screen.children[0].children[0];
        const diagram = () => root.children[2];
        const next = () => root.children.at(-1)!.events["click tap"]();

        expect(readRow(diagram(), 0, 0)).toBe("30");
        expect(readRow(diagram(), 0, 88)).toBe("29760");
        expect(readRow(diagram(), 0, 126)).toBe("1984");
        expect(readRow(diagram(), 1, 0)).toBe("");
        expect(readRow(diagram(), 1, 50)).toBe("");
        expect(readRow(diagram(), 1, 88)).toBe("");
        expect(readRow(diagram(), 1, 196)).toBe("");

        next();

        expect(similar).not.toHaveBeenCalled();
        expect(readRow(diagram(), 0, 0)).toBe("30");
        expect(readRow(diagram(), 0, 88)).toBe("29760");
        expect(readRow(diagram(), 0, 126)).toBe("1984");
        expect(readRow(diagram(), 1, 0)).toBe("2");
        expect(readRow(diagram(), 1, 50)).toBe("1984");
        expect(readRow(diagram(), 1, 88)).toBe("1984");
        expect(readRow(diagram(), 1, 126)).toBe("0");
        expect(readRow(diagram(), 1, 196)).toBe("32");
        expect(root.children.at(-1)!.children[1].attrs.text).toBe("Similar Question");

        const completedDiagram = diagram();
        next();
        expect(similar).toHaveBeenCalledTimes(1);
        expect(diagram()).toBe(completedDiagram);
        expect(readRow(diagram(), 1, 196)).toBe("32");
    });

    it("stops the Model at the last box even when asked to advance again", () => {
        const model = new SolutionScreenModel(exampleProblem());
        expect(model.getDivisionPage()).toMatchObject({ visibleBoxCount: 1, hasNext: true });
        model.nextDivisionPage();
        model.nextDivisionPage();
        expect(model.getDivisionPage()).toMatchObject({ visibleBoxCount: 2, hasNext: false });
    });

    it("starts completed for a problem with only one box", () => {
        const problem = new MainGameProblemGenerator(() => 0).generate({
            operation: "division", operandDigits: [5, 3],
        });
        const model = new SolutionScreenModel(problem);
        model.nextDivisionPage();
        expect(model.getDivisionPage()).toMatchObject({ visibleBoxCount: 1, hasNext: false });
        const similar = vi.fn();
        const controller = new SolutionScreenController(problem, similar);
        const screen = controller.getView().getGroup() as unknown as Drawing;
        const root = screen.children[0].children[0];
        expect(readRow(root.children[2], 0, 196)).toBe("100");
        expect(root.children.at(-1)!.children[1].attrs.text).toBe("Similar Question");
        root.children.at(-1)!.events["click tap"]();
        expect(similar).toHaveBeenCalledTimes(1);
    });

});
