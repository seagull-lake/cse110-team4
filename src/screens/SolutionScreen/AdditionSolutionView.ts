import Konva from "konva";
import type { AdditionColumn, SolutionStep } from "../../problem-engine/MainGameProblemGenerator.ts";
import { FONT_FAMILY, STAGE_WIDTH, STAGE_HEIGHT, TITLE_COLOR } from "../../constants.ts";
import { createHomeButton } from "../../components/HomeButton.ts";

/*
 * Addition solution, one column per page (like the Figma "Fixed grid" frames):
 *   page 0          -> Ones          (4 + 9 = 13)
 *   page 1          -> Tens          (1 + 8 + 8 = 17)   carry in + top digit + bottom digit
 *   ...
 *   page n - 1      -> last column the generator worked out
 *   page n          -> Full Solution (every box filled, leading 0s included)
 * where n = step.additionColumns.length.
 *
 * The grid is always (longest number + 1) columns wide, so a 5-digit problem has 6 answer
 * boxes and 5 carry boxes (tens .. hundred-thousands), even when nothing carries out.
 */

const CELL = 54;               // width of one column
const DIGIT_ROW = 62;          // height of a row of digits
const CARRY_SIZE = 40;         // carry boxes are smaller than digit cells
const ANSWER_SIZE = 50;
const DIGIT_FONT = 46;
const CARRY_FONT = 24;

const CARRY_Y = 150;
const TOP_NUMBER_Y = CARRY_Y + CARRY_SIZE + 10;
const BOTTOM_NUMBER_Y = TOP_NUMBER_Y + DIGIT_ROW;
const LINE_Y = BOTTOM_NUMBER_Y + DIGIT_ROW + 6;
const ANSWER_Y = LINE_Y + 12;

const GRID_AREA_WIDTH = 470;   // the grid is centered in the left part, the panel sits on the right
const PANEL = { x: 490, y: TOP_NUMBER_Y, width: 280, height: 124 };

const BACKGROUND = "#FFF0CF";
const HIGHLIGHT = "#F7D37A";   // current column, its carries, and its answer digit
const PANEL_FILL = "#FBE3A0";
const BOX_FILL = "#FFFFFF";
const NEXT_BUTTON = { width: 170, height: 40, fill: "#FFE28A" };

const PLACE_NAMES = ["Ones", "Tens", "Hundreds", "Thousands", "Ten Thousands", "Hundred Thousands", "Millions"];

export class AdditionSolutionView {
    private readonly group = new Konva.Group();
    private readonly onNextStep: () => void;
    private readonly onHome: () => void;
    private readonly onBackToMap: () => void;

    // Report button clicks to the Controller, which updates the Model.
    constructor(onNextStep: () => void, onHome: () => void = () => { }, onBackToMap: () => void = () => { }) {
        this.onNextStep = onNextStep;
        this.onHome = onHome;
        this.onBackToMap = onBackToMap;
    }

    /**
     * Draw one page of the addition solution.
     * @param step      the generator's addition step (needs additionColumns)
     * @param pageIndex 0 = ones column ... additionColumns.length = Full Solution
     * @param level     shown in the top-right corner when given
     */
    render(step: SolutionStep, pageIndex: number, level?: number): void {
        const columns = step.additionColumns;
        if (!columns) throw new Error("The current solution step is not addition.");

        this.group.destroyChildren(); // clear the previous page

        const lastPage = columns.length;                       // the Full Solution page
        const page = Math.max(0, Math.min(pageIndex, lastPage));
        const isFullSolution = page === lastPage;
        const doneColumns = isFullSolution ? columns.length : page + 1; // columns already worked out
        const current = isFullSolution ? -1 : page;            // column being explained (-1 = none)

        const top = String(step.leftOperand);
        const bottom = String(step.rightOperand);
        const numberColumns = Math.max(top.length, bottom.length);
        const gridColumns = Math.max(numberColumns + 1, columns.length); // fixed grid: one extra column on the left
        const gridLeft = (GRID_AREA_WIDTH - gridColumns * CELL) / 2 + 20;
        const gridRight = gridLeft + gridColumns * CELL;
        const columnX = (column: number) => gridRight - (column + 1) * CELL; // column 0 = ones

        this.group.add(new Konva.Rect({ width: STAGE_WIDTH, height: STAGE_HEIGHT, fill: BACKGROUND }));
        this.drawHeader(numberColumns, level);

        /*--- Highlight behind the current column's two digits ---*/
        if (current >= 0) {
            this.group.add(new Konva.Rect({
                x: columnX(current) + 3, y: TOP_NUMBER_Y + 3,
                width: CELL - 6, height: DIGIT_ROW * 2 - 6,
                fill: HIGHLIGHT, cornerRadius: 6, listening: false,
            }));
        }

        /*--- The two numbers, right-aligned, with "+" in the leftmost column ---*/
        this.drawNumber(top, TOP_NUMBER_Y, columnX);
        this.drawNumber(bottom, BOTTOM_NUMBER_Y, columnX);
        this.drawText("+", columnX(gridColumns - 1), BOTTOM_NUMBER_Y, CELL, DIGIT_ROW, DIGIT_FONT);
        this.group.add(new Konva.Line({
            points: [gridLeft, LINE_Y, gridRight, LINE_Y],
            stroke: TITLE_COLOR, strokeWidth: 3, lineCap: "round",
        }));

        /*--- Carry boxes: one above every column from the tens up ---*/
        for (let column = 1; column < gridColumns; column++) {
            const from = columns[column - 1];                    // the column that carries into this one
            const value = column - 1 < doneColumns ? String(from?.carryOut ?? 0)
                : isFullSolution ? "0" : "";
            // highlighted: the carry INTO the current column, and the carry OUT of it
            const highlighted = column === current || column === current + 1;
            this.drawBox(columnX(column), CARRY_Y, CARRY_SIZE, value, CARRY_FONT, highlighted);
        }

        /*--- Answer boxes: one under every column ---*/
        for (let column = 0; column < gridColumns; column++) {
            const value = column < doneColumns ? String(columns[column]?.resultDigit ?? 0)
                : isFullSolution ? "0" : "";
            this.drawBox(columnX(column), ANSWER_Y, ANSWER_SIZE, value, DIGIT_FONT - 10, column === current);
        }

        /*--- Explanation panel on the right ---*/
        this.drawPanel(isFullSolution ? undefined : columns[current], current);

        /*--- Buttons ---*/
        this.group.add(createHomeButton(this.onHome));
        this.drawNextButton(isFullSolution);

        this.group.getLayer()?.batchDraw();
    }

    getGroup(): Konva.Group {
        return this.group;
    }

    /*------ Helpers ------*/

    // "Addition"            "5 Digit Addition"            "Level 3"
    private drawHeader(numberColumns: number, level?: number): void {
        this.drawText("Addition", 30, 20, 200, 30, 18, "left");
        this.drawText(`${numberColumns} Digit Addition`, 0, 18, STAGE_WIDTH, 34, 26);
        if (level !== undefined) this.drawText(`Level ${level}`, STAGE_WIDTH - 230, 20, 200, 30, 18, "right");
    }

    // One digit per column, right-aligned so ones line up with ones
    private drawNumber(text: string, y: number, columnX: (column: number) => number): void {
        [...text].reverse().forEach((digit, column) =>
            this.drawText(digit, columnX(column), y, CELL, DIGIT_ROW, DIGIT_FONT));
    }

    // A square box centered in a column, optionally highlighted, with a value inside
    private drawBox(cellX: number, y: number, size: number, value: string, fontSize: number, highlighted: boolean): void {
        const x = cellX + (CELL - size) / 2;
        this.group.add(new Konva.Rect({
            x, y, width: size, height: size,
            fill: highlighted ? HIGHLIGHT : BOX_FILL,
            stroke: TITLE_COLOR, strokeWidth: 1.5, cornerRadius: 5, listening: false,
        }));
        if (value) this.drawText(value, x, y, size, size, fontSize);
    }

    // "Tens" + "1 + 8 + 8 = 17", or just "Full Solution" on the last page
    private drawPanel(column: AdditionColumn | undefined, index: number): void {
        this.group.add(new Konva.Rect({ ...PANEL, fill: PANEL_FILL, cornerRadius: 6, listening: false }));
        const title = column ? PLACE_NAMES[index] ?? `10^${index}` : "Full Solution";
        this.drawText(title, PANEL.x + 14, PANEL.y + 10, PANEL.width - 28, 24, 18, "left");
        if (!column) return;
        // The ones column has nothing carried in, so it only shows the two digits
        const equation = index === 0
            ? `${column.leftDigit} + ${column.rightDigit} = ${column.total}`
            : `${column.carryIn} + ${column.leftDigit} + ${column.rightDigit} = ${column.total}`;
        this.drawText(equation, PANEL.x, PANEL.y + 44, PANEL.width, 60, 30);
    }

    // "Next Step →" while there are columns left, "Back to Map" on the Full Solution page
    private drawNextButton(isFullSolution: boolean): void {
        const button = new Konva.Group({
            x: STAGE_WIDTH - 30 - NEXT_BUTTON.width,
            y: STAGE_HEIGHT - 62,
        });
        button.add(new Konva.Rect({
            width: NEXT_BUTTON.width, height: NEXT_BUTTON.height,
            fill: NEXT_BUTTON.fill, stroke: TITLE_COLOR, strokeWidth: 2, cornerRadius: 8,
        }));
        this.drawText(isFullSolution ? "Back to Map" : "Next Step →", 0, 0,
            NEXT_BUTTON.width, NEXT_BUTTON.height, 20, "center", button);
        button.on("click tap", () => (isFullSolution ? this.onBackToMap() : this.onNextStep()));
        button.on("mouseenter", () => (document.body.style.cursor = "pointer"));
        button.on("mouseleave", () => (document.body.style.cursor = "default"));
        this.group.add(button);
    }

    // Text never catches clicks, so buttons and boxes underneath still do
    private drawText(text: string, x: number, y: number, width: number, height: number, fontSize: number,
        align: "left" | "center" | "right" = "center", parent: Konva.Group = this.group): void {
        parent.add(new Konva.Text({
            x, y, width, height, text, fontSize,
            fontFamily: FONT_FAMILY, fill: TITLE_COLOR,
            align, verticalAlign: "middle", listening: false,
        }));
    }
}