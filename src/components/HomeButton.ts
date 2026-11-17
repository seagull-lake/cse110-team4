import Konva from "konva";
import { BUTTON_COLOR, BUTTON_TEXT_COLOR, FONT_FAMILY, STAGE_HEIGHT, TITLE_COLOR } from "../constants";

/**
 * Shared Home button — reuse in any screen's view:
 *   this.group.add(createHomeButton(onHomeClick));
 * Sits in the bottom-left corner by default, matching every screen.
 */
export function createHomeButton(onClick: () => void, x = 30, y = STAGE_HEIGHT - 62): Konva.Group {
    const button = new Konva.Group({ x, y });

    button.add(new Konva.Rect({
        width: 90,
        height: 40,
        fill: TITLE_COLOR,
        cornerRadius: 8,
    }));

    button.add(new Konva.Text({
        width: 90,
        height: 40,
        text: "Home",
        fontSize: 18,
        fontFamily: FONT_FAMILY,
        fill: "white",
        align: "center",
        verticalAlign: "middle",
    }));

    button.on("click", onClick);
    button.on("mouseenter", () => (document.body.style.cursor = "pointer"));
    button.on("mouseleave", () => (document.body.style.cursor = "default"));

    return button;
}

/**
 * Shared "Back to map" button, right of the Home button, like on the problem screen:
 *   this.group.add(createBackToMapButton(onBackClick));
 */
export function createBackToMapButton(onClick: () => void, x = 140, y = STAGE_HEIGHT - 62): Konva.Group {
    const button = new Konva.Group({ x, y });
    button.add(new Konva.Rect({ width: 150, height: 40, fill: BUTTON_COLOR, cornerRadius: 8 }));
    button.add(new Konva.Text({
        width: 150,
        height: 40,
        text: "Back to map",
        fontSize: 18,
        fontFamily: FONT_FAMILY,
        fill: BUTTON_TEXT_COLOR,
        align: "center",
        verticalAlign: "middle",
    }));
    button.on("click tap", onClick);
    button.on("mouseenter", () => (document.body.style.cursor = "pointer"));
    button.on("mouseleave", () => (document.body.style.cursor = "default"));
    return button;
}
