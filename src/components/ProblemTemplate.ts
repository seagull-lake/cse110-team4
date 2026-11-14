import Konva from "konva";
import { BUTTON_COLOR, BUTTON_TEXT_COLOR, FONT_FAMILY, STAGE_HEIGHT, TITLE_COLOR } from "../constants.ts";
import type { Cell, CellSize, FieldLayout, HorizontalLine } from "../screens/MainProblemScreen/MainProblemLayout.ts";

export function createProblemCell(cell: Cell, size: CellSize): Konva.Text {
    return new Konva.Text({
        ...cell, ...size, fontFamily: FONT_FAMILY, fill: TITLE_COLOR,
        align: "center", verticalAlign: "middle",
    });
}

export function createProblemBox(x: number, field: FieldLayout, fill = "#FFFFFF", stroke = BUTTON_COLOR): Konva.Rect {
    return new Konva.Rect({
        x: x + 4, y: field.y + 4, width: field.size.width - 8, height: field.size.height - 8,
        fill, stroke, strokeWidth: 2, cornerRadius: 6,
    });
}

export function createProblemLine({ x1, x2, y }: HorizontalLine, strokeWidth = 3): Konva.Line {
    return new Konva.Line({ points: [x1, y, x2, y], stroke: TITLE_COLOR, strokeWidth, lineCap: "round" });
}

export function createBackToMapButton(onClick: () => void): Konva.Group {
    const button = new Konva.Group({ x: 140, y: STAGE_HEIGHT - 62 });
    button.add(new Konva.Rect({ width: 150, height: 40, fill: BUTTON_COLOR, cornerRadius: 8 }));
    button.add(new Konva.Text({
        width: 150, height: 40, text: "Back to map", fontSize: 18, fontFamily: FONT_FAMILY,
        fill: BUTTON_TEXT_COLOR, align: "center", verticalAlign: "middle",
    }));
    button.on("click", onClick);
    button.on("mouseenter", () => (document.body.style.cursor = "pointer"));
    button.on("mouseleave", () => (document.body.style.cursor = "default"));
    return button;
}
