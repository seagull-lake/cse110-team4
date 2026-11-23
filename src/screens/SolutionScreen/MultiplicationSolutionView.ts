import Konva from "konva";
import { FONT_FAMILY, STAGE_HEIGHT, STAGE_WIDTH, TITLE_COLOR } from "../../constants.ts";
import { createBackToMapButton, createHomeButton, FINAL_ANSWER_FILL, createNextStepButton, createNumberField } from "../../components/ComponentFactory.ts";
import type { MainGameProblem } from "../../domain/problem.ts";
import { getProblemLayout } from "../MainProblemScreen/MainProblemLayout.ts";
import type { SolutionPage } from "./SolutionScreenModel.ts";

const CALCULATION_OFFSET_X = -120;
const FIELD_STROKE = "#27695B";
const WORKING_ROW_STROKE_WIDTH = 4;
const DIGIT_HIGHLIGHT_INSET = 4;
const EXPLANATION_CENTER_Y = 365;
const EXPLANATION_BOTTOM = STAGE_HEIGHT - 90;

/** Draws the multiplication solution on a Konva group. */
export class MultiplicationSolutionView {
    private readonly group = new Konva.Group();
    private readonly onHome: () => void;
    private readonly onBackToMap: () => void;
    private readonly onNextStep: () => void;

    /** Keep navigation callbacks separate from drawing. */
    constructor(onHome: () => void, onBackToMap: () => void, onNextStep: () => void) {
        this.onHome = onHome;
        this.onBackToMap = onBackToMap;
        this.onNextStep = onNextStep;
    }

    /** Draw the supplied multiplication page without generating a problem. */
    render(level: number, problem: MainGameProblem,
        page: Extract<SolutionPage, { operation: "multiplication" }>, explanation: string): void {
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
        // Draw the operands and multiplication symbol.
        layout.cells.forEach(cell => {
            calculation.add(new Konva.Text({
                x: cell.x,
                y: cell.y,
                width,
                height,
                text: cell.text,
                fontFamily: FONT_FAMILY,
                fontSize,
                fill: TITLE_COLOR,
                align: "center",
                verticalAlign: "middle",
            }));
        });
        const multiplierCell = layout.multiplierCells[shownRow];
        if (page.currentRow && multiplierCell) {
            const side = Math.min(multiplierCell.width, multiplierCell.height) - DIGIT_HIGHLIGHT_INSET * 2;
            calculation.add(new Konva.Rect({
                x: multiplierCell.x + (multiplierCell.width - side) / 2,
                y: multiplierCell.y + (multiplierCell.height - side) / 2,
                width: side,
                height: side,
                stroke: TITLE_COLOR,
                strokeWidth: 3,
                cornerRadius: 8,
                listening: false,
            }));
        }
        // Draw the calculation separators.
        for (const line of [layout.line, secondLine]) {
            if (line) calculation.add(new Konva.Line({
                points: [line.x1, line.y, line.x2, line.y], stroke: TITLE_COLOR, strokeWidth: 3,
            }));
        }
        if (page.currentRow) {
            // Show nonzero carries for the active row.
            layout.steps.filter(field => field.carry && field.row === shownRow)
                .forEach((field, index) => {
                    const carry = page.currentRow?.columns[index]?.carryOut;
                    if (carry) calculation.add(createNumberField(field, String(carry), {
                        fill: "#FFFFFF", stroke: FIELD_STROKE, strokeWidth: 2,
                        textName: "carry-digit",
                    }));
                });
        }
        // Draw partial products and the final answer.
        for (const [index, field] of [...productFields, answerField].entries()) {
            const row = page.visibleRows[index];
            const value = index === productFields.length ? page.finalAnswer : row?.partialProduct;
            const isCurrentProduct = page.currentRow !== undefined && index === shownRow;
            const isFinalAnswer = index === productFields.length;
            calculation.add(createNumberField(field, value === undefined ? "" : String(value), {
                fill: isFinalAnswer && page.finalAnswer !== undefined ? FINAL_ANSWER_FILL : "#FFFFFF",
                stroke: FIELD_STROKE,
                strokeWidth: isCurrentProduct ? WORKING_ROW_STROKE_WIDTH : 2,
                textName: isFinalAnswer ? "final-answer" : "partial-product",
            }));
        }
        this.group.add(calculation);
        const explanationPanel = new Konva.Label({ x: 480 });
        explanationPanel.add(new Konva.Tag({ fill: "#FFE9AE", cornerRadius: 8 }));
        // Let wrapped text set the panel height, keeping its bottom above the controls.
        const explanationText = new Konva.Text({
            width: 285,
            padding: 20,
            text: explanation,
            fontFamily: FONT_FAMILY,
            fontSize: 24,
            lineHeight: 1.3,
            fill: TITLE_COLOR,
            align: "center",
        });
        explanationPanel.add(explanationText);
        explanationPanel.y(Math.min(EXPLANATION_CENTER_Y - explanationText.height() / 2,
            EXPLANATION_BOTTOM - explanationText.height()));
        this.group.add(explanationPanel);
        this.group.add(createHomeButton(this.onHome));
        this.group.add(createBackToMapButton(this.onBackToMap));
        this.group.add(createNextStepButton(page.hasNext, this.onNextStep));
        this.group.getLayer()?.batchDraw();
    }

    /** Expose this view for attachment to the solution screen. */
    getGroup(): Konva.Group {
        return this.group;
    }
}
