import Konva from "konva";
import { BUTTON_COLOR, BUTTON_TEXT_COLOR, FONT_FAMILY, STAGE_HEIGHT, STAGE_WIDTH, TITLE_COLOR } from "../../constants.ts";
import { createHomeButton } from "../../components/HomeButton.ts";

const RIGHT_EDGE = 425;
const DIGIT_WIDTH = 38;

/** Draws the multiplication solution on a Konva group. */
export class MultiplicationSolutionView {
    private readonly group = new Konva.Group();
    private readonly onHome: () => void;
    private readonly onBackToMap: () => void;

    constructor(onHome: () => void, onBackToMap: () => void) {
        this.onHome = onHome;
        this.onBackToMap = onBackToMap;
    }

    render(level: number, multiplicand: number, multiplier: number): void {
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

        [multiplicand, multiplier].forEach((operand, row) => {
            const digits = String(operand);
            Array.from(digits).forEach((digit, index) => {
                this.group.add(new Konva.Text({
                    x: RIGHT_EDGE - (digits.length - index) * DIGIT_WIDTH,
                    y: 180 + row * 44,
                    width: DIGIT_WIDTH,
                    text: digit,
                    fontFamily: FONT_FAMILY,
                    fontSize: 32,
                    fill: TITLE_COLOR,
                    align: "center",
                }));
            });
        });
        this.group.add(new Konva.Text({
            x: RIGHT_EDGE - (Math.max(String(multiplicand).length, String(multiplier).length) + 1) * DIGIT_WIDTH,
            y: 224, width: DIGIT_WIDTH, text: "×",
            fontFamily: FONT_FAMILY, fontSize: 32, fill: TITLE_COLOR, align: "center",
        }));
        this.group.add(new Konva.Line({
            points: [100, 265, RIGHT_EDGE, 265], stroke: TITLE_COLOR, strokeWidth: 3,
        }));
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
        this.group.getLayer()?.batchDraw();
    }

    getGroup(): Konva.Group {
        return this.group;
    }
}
