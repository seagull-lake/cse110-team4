import Konva from "konva";
import { FONT_FAMILY, STAGE_HEIGHT, STAGE_WIDTH, TITLE_COLOR } from "../../constants.ts";
import { createHomeButton } from "../../components/HomeButton.ts";
import { createBackToMapButton, createProblemBox, createProblemCell, createProblemLine } from "../../components/ProblemTemplate.ts";
import type { MainGameProblem } from "../../domain/problem.ts";
import { getProblemLayout } from "../MainProblemScreen/MainProblemLayout.ts";

const CALCULATION_OFFSET_X = -120;

/** Draws the multiplication solution on a Konva group. */
export class MultiplicationSolutionView {
    private readonly group = new Konva.Group();
    private readonly onHome: () => void;
    private readonly onBackToMap: () => void;

    constructor(onHome: () => void, onBackToMap: () => void) {
        this.onHome = onHome;
        this.onBackToMap = onBackToMap;
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
        layout.cells.forEach(cell => calculation.add(createProblemCell(cell, layout.cellSize)));
        for (const line of [layout.line, layout.secondLine]) {
            if (line) calculation.add(createProblemLine(line));
        }
        for (const field of [...layout.steps, layout.answer]) {
            for (const x of field.cellXs) calculation.add(createProblemBox(x, field));
        }
        this.group.add(calculation);
        this.group.add(createHomeButton(this.onHome));
        this.group.add(createBackToMapButton(this.onBackToMap));
        this.group.getLayer()?.batchDraw();
    }

    getGroup(): Konva.Group {
        return this.group;
    }
}
