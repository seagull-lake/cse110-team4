import Konva from "konva";

/**
 * Shared Home button — reuse in any screen's view:
 *   this.group.add(createHomeButton(onHomeClick));
 */
export function createHomeButton(onClick: () => void): Konva.Group {
    const button = new Konva.Group({ x: 20, y: 20 });

    button.add(new Konva.Rect({
        width: 90,
        height: 40,
        fill: "#444",
        cornerRadius: 8,
    }));

    button.add(new Konva.Text({
        width: 90,
        height: 40,
        text: "Home",
        fontSize: 18,
        fontFamily: "Arial",
        fill: "white",
        align: "center",
        verticalAlign: "middle",
    }));

    button.on("click", onClick);
    button.on("mouseenter", () => (document.body.style.cursor = "pointer"));
    button.on("mouseleave", () => (document.body.style.cursor = "default"));

    return button;
}