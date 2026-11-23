import Konva from "konva";
import { BUTTON_COLOR, BUTTON_TEXT_COLOR, FONT_FAMILY, STAGE_HEIGHT, STAGE_WIDTH, TITLE_COLOR } from "../constants.ts";

export const PRIMARY_BUTTON_SIZE = { width: 170, height: 48 };

/** Shared green action button used by main-game actions and solution retries. */
export function createPrimaryButton(label: string, x: number, y: number, onClick: () => void): Konva.Group {
    const button = new Konva.Group({ x, y });
    button.add(new Konva.Rect({
        ...PRIMARY_BUTTON_SIZE, fill: BUTTON_COLOR, cornerRadius: 8,
    }));
    button.add(new Konva.Text({
        ...PRIMARY_BUTTON_SIZE, text: label, fontSize: 20, fontFamily: FONT_FAMILY,
        fill: BUTTON_TEXT_COLOR, align: "center", verticalAlign: "middle",
    }));
    button.on("click tap", onClick);
    button.on("mouseenter", () => (document.body.style.cursor = "pointer"));
    button.on("mouseleave", () => (document.body.style.cursor = "default"));
    return button;
}

/** Shared Submit / Continue button, originally used by the minigames. */
export function createActionButton(label: string, x = STAGE_WIDTH - 200, y = STAGE_HEIGHT - 70): Konva.Group {
    const button = new Konva.Group({ x, y });
    button.add(new Konva.Rect({
        width: 170,
        height: 45,
        fill: "#fbe7a9",
        stroke: TITLE_COLOR,
        strokeWidth: 3,
        cornerRadius: 8,
    }));
    button.add(new Konva.Text({
        text: label,
        width: 170,
        height: 45,
        fontSize: 22,
        fontFamily: FONT_FAMILY,
        fill: TITLE_COLOR,
        align: "center",
        verticalAlign: "middle",
    }));
    button.on("mouseenter", () => { document.body.style.cursor = "pointer"; });
    button.on("mouseleave", () => { document.body.style.cursor = "default"; });
    return button;
}

/** The answer boxes on the last page of every solution, the same green as a correct answer. */
export const FINAL_ANSWER_FILL = "#B8E6C7";

/**
 * The bottom-right button of every solution screen: "Next Step →" while there are steps left, then a
 * "Try Again" once the whole solution is shown. The controller handles either action.
 */
export function createNextStepButton(hasNext: boolean, onNextStep: () => void): Konva.Group {
    if (!hasNext) {
        const button = createPrimaryButton(
            "Try Again", STAGE_WIDTH - 30 - PRIMARY_BUTTON_SIZE.width,
            STAGE_HEIGHT - 22 - PRIMARY_BUTTON_SIZE.height, onNextStep,
        );
        button.name("next-step-button");
        return button;
    }
    const button = new Konva.Group({ x: STAGE_WIDTH - 190, y: STAGE_HEIGHT - 62, name: "next-step-button" });
    button.add(new Konva.Rect({
        width: 160, height: 40, fill: "#FFE28A", stroke: TITLE_COLOR, cornerRadius: 6,
    }));
    button.add(new Konva.Text({
        text: "Next Step →",
        width: 160,
        height: 40,
        fontSize: 22,
        fontFamily: FONT_FAMILY,
        fill: TITLE_COLOR,
        align: "center",
        verticalAlign: "middle",
        listening: false,
    }));
    button.on("click tap", onNextStep);
    button.on("mouseenter", () => { document.body.style.cursor = "pointer"; });
    button.on("mouseleave", () => { document.body.style.cursor = "default"; });
    return button;
}

/** Draw one right-aligned number field, leaving field selection to its caller. */
export function createNumberField(
    field: { y: number; cellXs: readonly number[]; size: { width: number; height: number; fontSize: number } },
    value: string,
    style: { fill: string; stroke: string; strokeWidth: number; textName?: string; textListening?: boolean },
    onClick?: () => void,
): Konva.Group {
    const group = new Konva.Group();
    const firstFilled = field.cellXs.length - value.length;
    // Align digits to the rightmost cells.
    field.cellXs.forEach((x, index) => {
        const box = new Konva.Rect({
            x: x + 4,
            y: field.y + 4,
            width: field.size.width - 8,
            height: field.size.height - 8,
            fill: style.fill,
            stroke: style.stroke,
            strokeWidth: style.strokeWidth,
            cornerRadius: 6,
        });
        if (onClick) {
            box.on("click tap", onClick);
            box.on("mouseenter", () => (document.body.style.cursor = "text"));
            box.on("mouseleave", () => (document.body.style.cursor = "default"));
        }
        group.add(box);
        const character = index >= firstFilled ? value[index - firstFilled] : "";
        if (character) group.add(new Konva.Text({
            name: style.textName,
            x,
            y: field.y,
            width: field.size.width,
            height: field.size.height,
            text: character === "-" ? "−" : character,
            fontSize: field.size.fontSize,
            fontFamily: FONT_FAMILY,
            fill: TITLE_COLOR,
            align: "center",
            verticalAlign: "middle",
            listening: style.textListening ?? true,
        }));
    });
    return group;
}
