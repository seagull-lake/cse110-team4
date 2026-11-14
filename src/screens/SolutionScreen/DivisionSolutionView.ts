import Konva from "konva";
import type { DivisionBoxMethod } from "../../problem-engine/MainGameProblemGenerator.ts";
import { FONT_FAMILY, STAGE_WIDTH, STAGE_HEIGHT, TITLE_COLOR } from "../../constants.ts";

const CELL_WIDTH = 30;
const ROW_HEIGHT = 38;
const BOX_PADDING = 8;

export class DivisionSolutionView{
    private readonly group = new Konva.Group();
    //draw the static division layout; solution numbers stay blank for now.
    render(division: DivisionBoxMethod): void {
        this.group.destroyChildren();

        this.group.add(new Konva.Rect({
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            fill: "#FFF0CF",
        }));
        this.drawText(this.group, "Division Solution", 0, 85, STAGE_WIDTH, 55, 40);

        const dividend = String(division.dividend);
        const divisor = String(division.divisor);
        const boxWidth = (dividend.length + 1) * CELL_WIDTH + BOX_PADDING * 2;
        const boxHeight = ROW_HEIGHT * 3 + BOX_PADDING * 2;
        const divisorWidth = divisor.length * CELL_WIDTH + BOX_PADDING;
        const diagramWidth = divisorWidth + division.boxes.length * boxWidth;

        //scale wide diagrams so every box remains inside the canvas.
        const scale = Math.min(1, (STAGE_WIDTH - 60) / diagramWidth);
        const diagram = new Konva.Group({
            x: (STAGE_WIDTH - diagramWidth * scale) / 2,
            y: 190,
            scaleX: scale,
            scaleY: scale,
        });
        this.group.add(diagram);

        const boxTop = ROW_HEIGHT + 4;
        const amountY = boxTop + BOX_PADDING;
        const productY = amountY + ROW_HEIGHT;
        const remainingY = productY + ROW_HEIGHT;

        this.drawText(diagram, divisor, 0, amountY, divisorWidth - BOX_PADDING, ROW_HEIGHT, 26);

        for (let i = 0; i < division.boxes.length; i++) {
            const box = division.boxes[i];
            const x = divisorWidth + i * boxWidth;
            const right = x + boxWidth - BOX_PADDING;
            const productLength = String(box.amountSubtracted).length;

            diagram.add(new Konva.Rect({
                x, y: boxTop, width: boxWidth, height: boxHeight,
                stroke: TITLE_COLOR, strokeWidth: 2,
            }));

            //the partial quotient sits above the box; product and remainder sit inside it.
            this.drawEmptySlots(diagram, right, 0, String(box.partialQuotient).length);
            this.drawEmptySlots(diagram, right, productY, productLength);
            this.drawEmptySlots(diagram, right, remainingY, String(box.remainingAmount).length);

            //only the first starting amount is shown at this stage.
            if (i === 0) {
                this.drawText(diagram, dividend, right - dividend.length * CELL_WIDTH,
                    amountY, dividend.length * CELL_WIDTH, ROW_HEIGHT, 26);
            }

            this.drawText(diagram, "−", right - (productLength + 1) * CELL_WIDTH,
                productY, CELL_WIDTH, ROW_HEIGHT, 26);
            diagram.add(new Konva.Line({
                points: [x + BOX_PADDING, remainingY, right, remainingY],
                stroke: TITLE_COLOR, strokeWidth: 2,
            }));
        }

        const answerLength = String(division.quotient).length;
        const answerY = boxTop + boxHeight + 24;
        const answerRight = diagramWidth - BOX_PADDING;
        this.drawText(diagram, "Answer", answerRight - answerLength * CELL_WIDTH - 110,
            answerY, 100, ROW_HEIGHT, 22);
        this.drawEmptySlots(diagram, answerRight, answerY, answerLength);
        this.group.getLayer()?.batchDraw();
    }

    //draw one empty slot per digit, aligned to the right edge of a box.
    private drawEmptySlots(parent: Konva.Group, right: number, y: number, count: number): void {
        for (let i = 0; i < count; i++) {
            parent.add(new Konva.Rect({
                x: right - (count - i) * CELL_WIDTH + 4,
                y: y + 4,
                width: CELL_WIDTH - 8,
                height: ROW_HEIGHT - 8,
                fill: "white",
                stroke: "#27695B",
                cornerRadius: 4,
            }));
        }
    }

    //draw a label or number without intercepting mouse events.
    private drawText(parent: Konva.Group, text: string, x: number, y: number,
        width: number, height: number, fontSize: number): void {
        parent.add(new Konva.Text({
            x, y, width, height, text, fontSize,
            fontFamily: FONT_FAMILY, fill: TITLE_COLOR,
            align: "center", verticalAlign: "middle", listening: false,
        }));
    }

  //return the diagram container so the parent screen can display it.
  getGroup(): Konva.Group {
    return this.group;
  }
}
    
