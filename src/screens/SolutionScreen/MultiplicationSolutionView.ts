import Konva from "konva";
import { FONT_FAMILY, STAGE_HEIGHT, STAGE_WIDTH, TITLE_COLOR } from "../../constants.ts";
import type { MultiplicationRow } from "../../problem-engine/MainGameProblemGenerator.ts";

/** Data the multiplication template needs; all arithmetic comes from the Problem Engine. */
export interface MultiplicationSolutionViewData {
    readonly multiplicand: number;
    readonly multiplier: number;
    readonly visibleRows: readonly MultiplicationRow[];
    readonly currentRow: MultiplicationRow;
    readonly finalAnswer?: number;
}

const RIGHT_EDGE = 430;
const CELL_WIDTH = 38;
const ROW_HEIGHT = 42;
const CURRENT_FILL = "#FFE28A";
const PREVIOUS_STROKE = "#27695B";

export function getMultiplicationDisplay(data: MultiplicationSolutionViewData) {
    return {
        ...data,
        rows: data.visibleRows.map(row => ({ row, isCurrent: row === data.currentRow })),
    };
}

export class MultiplicationSolutionView {
    private readonly group = new Konva.Group();

    render(data: MultiplicationSolutionViewData): void {
        this.group.destroyChildren();
        const display = getMultiplicationDisplay(data);

        this.group.add(new Konva.Rect({ width: STAGE_WIDTH, height: STAGE_HEIGHT, fill: "#FFF0CF" }));
        this.group.add(new Konva.Text({
            x: 0, y: 70, width: STAGE_WIDTH, height: 55, text: "Multiplication Solution",
            fontSize: 40, fontFamily: FONT_FAMILY, fill: TITLE_COLOR,
            align: "center", verticalAlign: "middle",
        }));
        this.group.add(this.numberText(display.multiplicand, 145));
        this.group.add(this.numberText(display.multiplier, 187));
        this.group.add(new Konva.Text({
            x: 65, y: 187, width: 45, height: ROW_HEIGHT, text: "×",
            fontSize: 34, fontFamily: FONT_FAMILY, fill: TITLE_COLOR,
            align: "center", verticalAlign: "middle",
        }));
        this.group.add(this.line(95, RIGHT_EDGE, 232));

        display.rows.forEach(({ row, isCurrent }, index) => {
            const name = isCurrent ? "current-row" : "previous-row";
            const rowGroup = this.boxes(row.partialProduct, 245 + index * ROW_HEIGHT, name);
            rowGroup.name(`partial-row ${name}`);
            this.group.add(rowGroup);
        });

        const resultLineY = 250 + display.rows.length * ROW_HEIGHT;
        if (display.finalAnswer !== undefined) {
            this.group.add(this.line(95, RIGHT_EDGE, resultLineY));
            const answer = this.boxes(display.finalAnswer, resultLineY + 10, "answer-row");
            answer.name("answer-row");
            this.group.add(answer);
        }

        this.group.getLayer()?.batchDraw();

    }

    private numberText(value: number, y: number): Konva.Text {
        return new Konva.Text({
            x: 95, y, width: RIGHT_EDGE - 95, height: ROW_HEIGHT, text: String(value),
            fontSize: 38, letterSpacing: 7, fontFamily: FONT_FAMILY, fill: TITLE_COLOR,
            align: "right", verticalAlign: "middle",
        });
    }

    private boxes(value: number, y: number, name: string): Konva.Group {
        const text = String(value);
        const group = new Konva.Group({ name });
        const height = ROW_HEIGHT - 4;
        Array.from(text).forEach((digit, index) => {
            const x = RIGHT_EDGE - (text.length - index) * CELL_WIDTH;
            group.add(new Konva.Rect({
                x: x + 2, y: y + 2, width: CELL_WIDTH - 4, height,
                fill: name === "previous-row" ? "#FFFDF5" : CURRENT_FILL,
                stroke: name === "previous-row" ? PREVIOUS_STROKE : TITLE_COLOR,
                strokeWidth: 2, cornerRadius: 5,
            }));
            group.add(new Konva.Text({
                x: x + 2, y: y + 2, width: CELL_WIDTH - 4, height,
                text: digit, fontSize: 32,
                fontFamily: FONT_FAMILY, fill: TITLE_COLOR, align: "center", verticalAlign: "middle",
            }));
        });
        return group;
    }

    private line(x1: number, x2: number, y: number): Konva.Line {
        return new Konva.Line({ points: [x1, y, x2, y], stroke: TITLE_COLOR, strokeWidth: 3 });
    }

    getGroup(): Konva.Group { return this.group; }
}
