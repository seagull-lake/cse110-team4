import Konva from "konva";
import { BUTTON_COLOR, BUTTON_TEXT_COLOR, FONT_FAMILY, STAGE_HEIGHT, STAGE_WIDTH, TITLE_COLOR } from "../../constants.ts";
import { createHomeButton } from "../../components/HomeButton.ts";
import type { MainGameProblem } from "../../domain/problem.ts";
import { getProblemLayout } from "../MainProblemScreen/MainProblemLayout.ts";
import type { SolutionScreenModel } from "./SolutionScreenModel.ts";

const CALCULATION_OFFSET_X = -120;
const FIELD_STROKE = "#27695B";
const CORRECT_FILL = "#B8E6C7";
const WORKING_ROW_STROKE_WIDTH = 4;
const DIGIT_HIGHLIGHT_INSET = 4;

/** Draws the multiplication solution on a Konva group. */
export class MultiplicationSolutionView {
    private readonly group = new Konva.Group();
    private readonly onHome: () => void;
    private readonly onBackToMap: () => void;
    private readonly onNextStep: () => void;

    constructor(onHome: () => void, onBackToMap: () => void, onNextStep: () => void) {
        this.onHome = onHome;
        this.onBackToMap = onBackToMap;
        this.onNextStep = onNextStep;
    }

    render(level: number, problem: MainGameProblem,
        page: ReturnType<SolutionScreenModel["getMultiplicationPage"]>, explanation: string): void {
        const layout = getProblemLayout("multiplication", problem);
        if (layout.kind !== "column") throw new Error("Expected a multiplication column layout.");
        const shownRow = Math.max(0, page.visibleRows.length - 1);
        let productFields = layout.steps.filter(field => !field.carry);
        let secondLine = layout.secondLine;
        let answerField = layout.answer;
        // A one-digit multiplier has only carry fields, so add a row for its product.
        if (productFields.length === 0) {
            productFields = [{ ...layout.answer, y: layout.line.y + 12 }];
            secondLine = { ...layout.line, y: productFields[0].y + layout.cellSize.height + 4 };
            answerField = { ...layout.answer, y: secondLine.y + 12 };
        }
        this.group.destroyChildren();
        this.group.add(new Konva.Rect({
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            fill: "#FFF0CF",
        }));
        this.group.add(new Konva.Text({
            x: 0,
            y: 90,
            width: STAGE_WIDTH,
            text: `Multiplication – Level ${level}`,
            fontFamily: FONT_FAMILY,
            fontSize: 50,
            fill: TITLE_COLOR,
            align: "center",
        }));

        const calculation = new Konva.Group({ x: CALCULATION_OFFSET_X });
        const { width, height, fontSize } = layout.cellSize;
        layout.cells.forEach(cell => {
            calculation.add(new Konva.Text({
                x: cell.x, y: cell.y, width, height, text: cell.text,
                fontFamily: FONT_FAMILY, fontSize, fill: TITLE_COLOR,
                align: "center", verticalAlign: "middle",
            }));
        });
        const multiplierCell = layout.multiplierCells[shownRow];
        if (page.currentRow && multiplierCell) {
            const side = Math.min(multiplierCell.width, multiplierCell.height) - DIGIT_HIGHLIGHT_INSET * 2;
            calculation.add(new Konva.Rect({
                x: multiplierCell.x + (multiplierCell.width - side) / 2,
                y: multiplierCell.y + (multiplierCell.height - side) / 2,
                width: side, height: side,
                stroke: TITLE_COLOR, strokeWidth: 3, cornerRadius: 8, listening: false,
            }));
        }
        for (const line of [layout.line, secondLine]) {
            if (line) calculation.add(new Konva.Line({
                points: [line.x1, line.y, line.x2, line.y], stroke: TITLE_COLOR, strokeWidth: 3,
            }));
        }
        if (page.currentRow) {
            layout.steps.filter(field => field.carry && field.row === shownRow)
                .forEach((field, index) => {
                    const carry = page.currentRow?.columns[index]?.carryOut;
                    if (carry) calculation.add(createNumberField(field, String(carry), {
                        fill: "#FFFFFF", stroke: FIELD_STROKE, strokeWidth: 2,
                        textName: "carry-digit",
                    }));
                });
        }
        for (const [index, field] of [...productFields, answerField].entries()) {
            const row = page.visibleRows[index];
            const value = index === productFields.length ? page.finalAnswer : row?.partialProduct;
            const isCurrentProduct = page.currentRow !== undefined && index === shownRow;
            const isFinalAnswer = index === productFields.length;
            calculation.add(createNumberField(field, value === undefined ? "" : String(value), {
                fill: isFinalAnswer && page.finalAnswer !== undefined ? CORRECT_FILL : "#FFFFFF",
                stroke: FIELD_STROKE,
                strokeWidth: isCurrentProduct ? WORKING_ROW_STROKE_WIDTH : 2,
                textName: isFinalAnswer ? "final-answer" : "partial-product",
            }));
        }
        this.group.add(calculation);
        const explanationPanel = new Konva.Label({ x: 480, y: 290 });
        explanationPanel.add(new Konva.Tag({ fill: "#FFE9AE", cornerRadius: 8 }));
        explanationPanel.add(new Konva.Text({
            width: 285, height: 150, padding: 20,
            text: explanation,
            fontFamily: FONT_FAMILY, fontSize: 24, lineHeight: 1.3, fill: TITLE_COLOR,
            align: "center", verticalAlign: "middle",
        }));
        this.group.add(explanationPanel);
        this.group.add(createHomeButton(this.onHome));
        const backButton = new Konva.Group({ x: 140, y: STAGE_HEIGHT - 62 });
        backButton.add(new Konva.Rect({ width: 150, height: 40, fill: BUTTON_COLOR, cornerRadius: 8 }));
        backButton.add(new Konva.Text({
            width: 150, height: 40, text: "Back to map", fontSize: 18, fontFamily: FONT_FAMILY,
            fill: BUTTON_TEXT_COLOR, align: "center", verticalAlign: "middle",
        }));
        backButton.on("click", this.onBackToMap);
        backButton.on("mouseenter", () => (document.body.style.cursor = "pointer"));
        backButton.on("mouseleave", () => (document.body.style.cursor = "default"));
        this.group.add(backButton);
        const nextButton = createActionButton("Next Step");
        nextButton.visible(page.hasNext);
        nextButton.on("click tap", this.onNextStep);
        this.group.add(nextButton);
        this.group.getLayer()?.batchDraw();
    }

    getGroup(): Konva.Group {
        return this.group;
    }
}

/** Draw the solution navigation button. */
function createActionButton(label: string, x = STAGE_WIDTH - 200, y = STAGE_HEIGHT - 70): Konva.Group {
    const button = new Konva.Group({ x, y });
    button.add(new Konva.Rect({
        width: 170, height: 45, fill: "#fbe7a9", stroke: TITLE_COLOR, strokeWidth: 3, cornerRadius: 8,
    }));
    button.add(new Konva.Text({
        text: label, width: 170, height: 45, fontSize: 22, fontFamily: FONT_FAMILY, fill: TITLE_COLOR,
        align: "center", verticalAlign: "middle",
    }));
    button.on("mouseenter", () => { document.body.style.cursor = "pointer"; });
    button.on("mouseleave", () => { document.body.style.cursor = "default"; });
    return button;
}

/** Draw one right-aligned number field, leaving field selection to its caller. */
function createNumberField(
    field: { y: number; cellXs: readonly number[]; size: { width: number; height: number; fontSize: number } },
    value: string,
    style: { fill: string; stroke: string; strokeWidth: number; textName?: string; textListening?: boolean },
    onClick?: () => void,
): Konva.Group {
    const group = new Konva.Group();
    const firstFilled = field.cellXs.length - value.length;
    field.cellXs.forEach((x, index) => {
        const box = new Konva.Rect({
            x: x + 4, y: field.y + 4, width: field.size.width - 8, height: field.size.height - 8,
            fill: style.fill, stroke: style.stroke, strokeWidth: style.strokeWidth, cornerRadius: 6,
        });
        if (onClick) {
            box.on("click tap", onClick);
            box.on("mouseenter", () => (document.body.style.cursor = "text"));
            box.on("mouseleave", () => (document.body.style.cursor = "default"));
        }
        group.add(box);
        const character = index >= firstFilled ? value[index - firstFilled] : "";
        if (character) group.add(new Konva.Text({
            name: style.textName, x, y: field.y, width: field.size.width, height: field.size.height,
            text: character === "-" ? "−" : character, fontSize: field.size.fontSize,
            fontFamily: FONT_FAMILY, fill: TITLE_COLOR, align: "center", verticalAlign: "middle",
            listening: style.textListening ?? true,
        }));
    });
    return group;
}
