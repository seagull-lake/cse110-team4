import Konva from "konva";
import { BUTTON_COLOR, BUTTON_TEXT_COLOR, FONT_FAMILY, STAGE_HEIGHT, STAGE_WIDTH, TITLE_COLOR } from "../../constants.ts";
import { createHomeButton } from "../../components/HomeButton.ts";
import { createActionButton } from "../../components/ActionButton.ts";
import type { MainGameProblem } from "../../domain/problem.ts";
import { getProblemLayout } from "../MainProblemScreen/MainProblemLayout.ts";

const CALCULATION_OFFSET_X = -120;

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

    render(level: number, problem: MainGameProblem): void {
        const layout = getProblemLayout("multiplication", problem);
        if (layout.kind !== "column") throw new Error("Expected a multiplication column layout.");
        this.group.destroyChildren();
        this.group.add(new Konva.Rect({
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            fill: "#FFF0CF",
        }));
        this.group.add(new Konva.Text({
            x: 0,
            y: 75,
            width: STAGE_WIDTH,
            text: `Multiplication – Level ${level}`,
            fontFamily: FONT_FAMILY,
            fontSize: 40,
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
        for (const line of [layout.line, layout.secondLine]) {
            if (line) calculation.add(new Konva.Line({
                points: [line.x1, line.y, line.x2, line.y], stroke: TITLE_COLOR, strokeWidth: 3,
            }));
        }
        for (const field of [...layout.steps, layout.answer]) {
            for (const x of field.cellXs) calculation.add(new Konva.Rect({
                x: x + 4, y: field.y + 4, width: field.size.width - 8, height: field.size.height - 8,
                fill: "#FFFFFF", stroke: BUTTON_COLOR, strokeWidth: 2, cornerRadius: 6,
            }));
        }
        this.group.add(calculation);
        const explanationPanel = new Konva.Label({ x: 480, y: 290 });
        explanationPanel.add(new Konva.Tag({ fill: "#FFE9AE", cornerRadius: 8 }));
        explanationPanel.add(new Konva.Text({
            width: 285, height: 150, padding: 20,
            // Temporary example until the controller supplies the current solution step.
            text: "Units digit: 1\n36748 × 1 = 36748\nFirst partial product.",
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
        nextButton.on("click tap", this.onNextStep);
        this.group.add(nextButton);
        this.group.getLayer()?.batchDraw();
    }

    getGroup(): Konva.Group {
        return this.group;
    }
}
