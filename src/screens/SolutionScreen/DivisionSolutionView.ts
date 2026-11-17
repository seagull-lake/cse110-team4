import Konva from "konva";
import type { DivisionBoxMethod } from "../../problem-engine/MainGameProblemGenerator.ts";
import { FONT_FAMILY, STAGE_WIDTH, STAGE_HEIGHT, TITLE_COLOR } from "../../constants.ts";
import { createBackToMapButton, createHomeButton } from "../../components/HomeButton.ts";
import { FINAL_ANSWER_FILL, createNextStepButton } from "../../components/ComponentFactory.ts";

const CELL_WIDTH = 30;
const ROW_HEIGHT = 38;
const BOX_PADDING = 8;

export class DivisionSolutionView{
    private readonly group = new Konva.Group();//the entire diagram is drawn inside this group, which is returned to the parent screen for display
    private readonly onNextStep: () => void;
    private readonly onHome: () => void;
    private readonly onBackToMap: () => void;

    // Report button clicks to the Controller, which updates the Model or changes the screen.
    constructor(onNextStep: () => void = () => {}, onHome: () => void = () => {}, onBackToMap: () => void = () => {}) {
        this.onNextStep = onNextStep;
        this.onHome = onHome;
        this.onBackToMap = onBackToMap;
    }

    // Draw all boxes and fill only those revealed by the Model.
    render(division: DivisionBoxMethod, visibleBoxCount = 1): void {
        this.group.destroyChildren();//clear any previous diagram
        const count = Math.max(1, Math.min(visibleBoxCount, division.boxes.length));//the number of boxes to reveal

        this.group.add(new Konva.Rect({ // background
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            fill: "#FFF0CF",
        }));
        this.drawText(this.group, "Division Solution",
            0, 85, STAGE_WIDTH, 55, 40);//title above the diagram

        const dividend = String(division.dividend);//the dividend is shown inside the first box, and in all revealed boxes
        const divisor = String(division.divisor);//the divisor is shown to the left of the boxes
        const boxWidth = (dividend.length + 1) * CELL_WIDTH + BOX_PADDING * 2;//each box is wide enough to hold the starting amount plus one extra digit for the next partial quotient
        const boxHeight = ROW_HEIGHT * 3 + BOX_PADDING * 2;//each box has three rows: partial quotient, product, and remaining amount
        const divisorWidth = divisor.length * CELL_WIDTH + BOX_PADDING;//the divisor is drawn in a box to the left of the first box
        const diagramWidth = divisorWidth + division.boxes.length * boxWidth;//the total width of the diagram is the divisor plus all the boxes

        //scale wide diagrams so every box remains inside the canvas.
        const scale = Math.min(1, (STAGE_WIDTH - 60) / diagramWidth);
        const diagram = new Konva.Group({
            x: (STAGE_WIDTH - diagramWidth * scale) / 2, //center the diagram horizontally
            y: 190,
            scaleX: scale,
            scaleY: scale,
        });
        this.group.add(diagram);//the diagram is drawn inside this group, which is scaled to fit the canvas

        const boxTop = ROW_HEIGHT + 4;
        const amountY = boxTop + BOX_PADDING;
        const productY = amountY + ROW_HEIGHT;
        const remainingY = productY + ROW_HEIGHT;

        this.drawText(diagram, divisor, 0, amountY, divisorWidth - BOX_PADDING, ROW_HEIGHT, 26);

        for (let i = 0; i < division.boxes.length; i++) {
            const box = division.boxes[i];
            const left = divisorWidth + i * boxWidth;
            const right = left + boxWidth - BOX_PADDING;
            const productLength = String(box.amountSubtracted).length;

            diagram.add(new Konva.Rect({
                x: left, y: boxTop, width: boxWidth, height: boxHeight,
                stroke: TITLE_COLOR, strokeWidth: 2,
            }));

            //the partial quotient sits above the box; product and remainder sit inside it.
            this.drawEmptySlots(diagram, right, 0, String(box.partialQuotient).length);
            this.drawEmptySlots(diagram, right, productY, productLength);
            this.drawEmptySlots(diagram, right, remainingY, String(box.remainingAmount).length);

            //keep earlier boxes filled and show the starting amount of each revealed box.
            // Fill the starting amount and solution numbers of each revealed box.
            if (i < count) {
                this.drawSlotNumber(diagram, right, amountY, box.startingAmount);
                this.drawSlotNumber(diagram, right, 0, box.partialQuotient);
                this.drawSlotNumber(diagram, right, productY, box.amountSubtracted);
                this.drawSlotNumber(diagram, right, remainingY, box.remainingAmount);
            }

            this.drawText(diagram, "−", right - (productLength + 1) * CELL_WIDTH, productY, CELL_WIDTH, ROW_HEIGHT, 26);
            diagram.add(new Konva.Line({
                points: [left + BOX_PADDING, remainingY, right, remainingY],
                stroke: TITLE_COLOR, strokeWidth: 2,
            }));
        }

        const answerLength = String(division.quotient).length;
        const answerY = boxTop + boxHeight + 24;
        const answerRight = diagramWidth - BOX_PADDING;
        this.drawText(diagram, "Answer", answerRight - answerLength * CELL_WIDTH - 110,answerY, 100, ROW_HEIGHT, 22);
        // The answer boxes turn green once every box has been shown and the quotient is revealed
        const isLastPage = count === division.boxes.length;
        this.drawEmptySlots(diagram, answerRight, answerY, answerLength, isLastPage ? FINAL_ANSWER_FILL : "white");
        if (isLastPage) {
            this.drawSlotNumber(diagram, answerRight, answerY, division.quotient);
        }
        // Home and Back to map, like the problem screen, so the student is never stuck here
        this.group.add(createHomeButton(this.onHome));
        this.group.add(createBackToMapButton(this.onBackToMap));
        // "Next Step →" while there are boxes left to reveal, then a faded "Completed"
        this.group.add(createNextStepButton(count < division.boxes.length, this.onNextStep));
        this.group.getLayer()?.batchDraw();//redraw the layer to reflect the changes
    }

    //draw one empty slot per digit, aligned to the right edge of a box.
    private drawEmptySlots(parent: Konva.Group, right: number, y: number, count: number, fill = "white"): void {
        for (let i = 0; i < count; i++) {
            parent.add(new Konva.Rect({
                x: right - (count - i) * CELL_WIDTH + 4,
                y: y + 4,
                width: CELL_WIDTH - 8,
                height: ROW_HEIGHT - 8,
                fill,
                stroke: "#27695B",
                cornerRadius: 4,
            }));
        }
    }
    //write each digit into its own slot, aligned with the right edge.
    private drawSlotNumber(parent: Konva.Group, right: number, y: number, value: number): void {
        const digits = String(value);
        for (let i = 0; i < digits.length; i++) {
            const x = right - (digits.length - i) * CELL_WIDTH;
            this.drawText(parent, digits[i], x, y, CELL_WIDTH, ROW_HEIGHT, 26);
        }
    }
    //draw a label or number without intercepting mouse events.
    private drawText(parent: Konva.Group, text: string, x: number, y: number,width: number, height: number, fontSize: number): void {
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
    
