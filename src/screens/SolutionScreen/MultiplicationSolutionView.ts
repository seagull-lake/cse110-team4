import Konva from "konva";
import { FONT_FAMILY, STAGE_HEIGHT, STAGE_WIDTH, TITLE_COLOR } from "../../constants.ts";

const RIGHT_EDGE = 425;
const DIGIT_WIDTH = 38;

/** Draws the multiplication solution on a Konva group. */
export class MultiplicationSolutionView {
    private readonly group = new Konva.Group();

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
        this.group.getLayer()?.batchDraw();
    }

    getGroup(): Konva.Group {
        return this.group;
    }
}
