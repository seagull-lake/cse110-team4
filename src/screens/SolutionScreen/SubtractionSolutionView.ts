import Konva from "konva";
import { BUTTON_COLOR, FONT_FAMILY, STAGE_HEIGHT, STAGE_WIDTH, TITLE_COLOR } from "../../constants.ts";
import { getProblemLayout } from "../MainProblemScreen/MainProblemLayout.ts";
import type { FieldLayout } from "../MainProblemScreen/MainProblemLayout.ts";
import { explainSubtractionColumn } from "./SolutionScreenModel.ts";
import type { SubtractionPage } from "./SolutionScreenModel.ts";

/** The column being explained is shaded so the student can follow it. */
const CURRENT_COLUMN_FILL = "#FFE28A";

/** Draws the subtraction solution: the problem in columns, filled in one column at a time. */
export class SubtractionSolutionView {
    private readonly group = new Konva.Group();
    private readonly onNextStep: () => void;

    // Report button clicks to the Controller, which updates the Model.
    constructor(onNextStep: () => void = () => {}) {
        this.onNextStep = onNextStep;
    }

    render(page: SubtractionPage): void {
        this.group.destroyChildren();
        this.group.add(new Konva.Rect({ width: STAGE_WIDTH, height: STAGE_HEIGHT, fill: "#FFF0CF" }));
        this.drawText(this.group, "Subtraction Solution", 0, 85, STAGE_WIDTH, 55, 40);
        if (page.isNegative) {
            this.drawText(this.group, `${page.bottom} is smaller than ${page.top}, so work out ` +
                `${page.top} − ${page.bottom} and put a minus in front.`, 0, 140, STAGE_WIDTH, 30, 18);
        }

        // Same columns and boxes as the problem screen, so the solution looks like what the student filled in
        const layout = getProblemLayout("subtraction", { operands: [page.top, page.bottom], answer: page.top - page.bottom });
        if (layout.kind !== "column") throw new Error("Expected a subtraction column layout.");
        const { width: cell, height: row, fontSize } = layout.cellSize;
        const right = layout.line.x2;

        // Shade the column being explained, from the borrow row down to the answer
        const current = page.visibleColumnCount - 1;
        const top = layout.steps[0]?.y ?? layout.cells[0].y;
        this.group.add(new Konva.Rect({
            x: right - (current + 1) * cell, y: top, width: cell,
            height: layout.answer.y + layout.answer.size.height - top,
            fill: CURRENT_COLUMN_FILL, opacity: 0.6, cornerRadius: 6,
        }));

        layout.cells.forEach(({ x, y, text }) => this.drawText(this.group, text, x, y, cell, row, fontSize));
        this.group.add(new Konva.Line({
            points: [layout.line.x1, layout.line.y, layout.line.x2, layout.line.y], stroke: TITLE_COLOR, strokeWidth: 3,
        }));

        // Borrow boxes: box k sits above column k (1 = tens) and holds what it lent to the column before,
        // so it is filled in together with that column
        layout.steps.forEach((field, index) => {
            this.drawBoxes(field);
            if (index < page.visibleColumnCount) this.drawDigits(field, String(page.columns[index].borrowOut));
        });

        // Result digits under the line, ones first. Leading zeros (e.g. 1000 − 999) have no box.
        this.drawBoxes(layout.answer);
        const answerXs = [...layout.answer.cellXs].reverse();
        page.columns.slice(0, page.visibleColumnCount).forEach((column, index) => {
            const x = answerXs[index];
            if (x !== undefined) this.drawText(this.group, String(column.resultDigit), x, layout.answer.y, cell, row, fontSize);
        });

        const belowAnswer = layout.answer.y + layout.answer.size.height + 24;
        this.drawText(this.group, explainSubtractionColumn(page.currentColumn, current),
            40, belowAnswer, STAGE_WIDTH - 80, 60, 22);
        if (page.finalAnswer !== undefined) {
            this.drawText(this.group, `Answer: ${String(page.finalAnswer).replace("-", "−")}`, 0, belowAnswer + 70, STAGE_WIDTH, 40, 30);
        }
        this.drawNextButton(page.hasNext);
        this.group.getLayer()?.batchDraw();
    }

    // Request the next column, disabling the button once every column is shown (same as division).
    private drawNextButton(hasNext: boolean): void {
        const button = new Konva.Group({ x: STAGE_WIDTH - 190, y: STAGE_HEIGHT - 62 });
        button.add(new Konva.Rect({
            width: 160, height: 40, fill: "#FFE28A", stroke: TITLE_COLOR, cornerRadius: 6, opacity: hasNext ? 1 : 0.5,
        }));
        this.drawText(button, hasNext ? "Next Step →" : "Completed", 0, 0, 160, 40, 22);
        button.on("click tap", () => { if (hasNext) this.onNextStep(); });
        button.on("mouseenter", () => (document.body.style.cursor = hasNext ? "pointer" : "default"));
        button.on("mouseleave", () => (document.body.style.cursor = "default"));
        this.group.add(button);
    }

    // One empty box per character of a field.
    private drawBoxes(field: FieldLayout): void {
        field.cellXs.forEach(x => this.group.add(new Konva.Rect({
            x: x + 4, y: field.y + 4, width: field.size.width - 8, height: field.size.height - 8,
            fill: "#FFFFFF", stroke: BUTTON_COLOR, strokeWidth: 2, cornerRadius: 6, listening: false,
        })));
    }

    // Write a number into a field's boxes, right-aligned.
    private drawDigits(field: FieldLayout, digits: string): void {
        const xs = field.cellXs.slice(-digits.length);
        [...digits].forEach((digit, index) =>
            this.drawText(this.group, digit, xs[index], field.y, field.size.width, field.size.height, field.size.fontSize));
    }

    // Draw a label or number without catching mouse events.
    private drawText(parent: Konva.Group, text: string, x: number, y: number,
        width: number, height: number, fontSize: number): void {
        parent.add(new Konva.Text({
            x, y, width, height, text, fontSize, fontFamily: FONT_FAMILY, fill: TITLE_COLOR,
            align: "center", verticalAlign: "middle", wrap: "word", listening: false,
        }));
    }

    getGroup(): Konva.Group {
        return this.group;
    }
}
