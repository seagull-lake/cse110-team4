import Konva from "konva";
import { FONT_FAMILY, STAGE_HEIGHT, STAGE_WIDTH, TITLE_COLOR } from "../constants.ts";

/** Shared Submit / Continue button, originally used by the minigames. */
export function createActionButton(label: string, x = STAGE_WIDTH - 200, y = STAGE_HEIGHT - 70): Konva.Group {
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
