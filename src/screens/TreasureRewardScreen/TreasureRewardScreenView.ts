import Konva from "konva";
import type { View } from "../../types.ts";
import { createHomeButton, createPrimaryButton, PRIMARY_BUTTON_SIZE } from "../../components/ComponentFactory.ts";
import { FONT_FAMILY, STAGE_WIDTH, STAGE_HEIGHT, TITLE_COLOR } from "../../constants.ts";
import type { TreasureRewardPage } from "./TreasureRewardScreenModel.ts";
import type { TopicTreasureDefinition } from "../../levels/treasureConfig.ts";

const GOLD = "#FFDC65";
const PINK = "#FF3766";

export class TreasureRewardScreenView implements View {
    private readonly group = new Konva.Group({ visible: false });
    private readonly content = new Konva.Group();

    // Connect the persistent buttons to the Controller's callbacks.
    constructor(onContinue: () => void, onHome: () => void) {
        this.group.add(new Konva.Rect({ width: STAGE_WIDTH, height: STAGE_HEIGHT, fill: "#FFF5DD" }));
        this.group.add(this.content);
        const homeButton = createHomeButton(onHome);
        homeButton.on("tap", onHome);
        const continueButton = createPrimaryButton(
            "Continue", STAGE_WIDTH - 30 - PRIMARY_BUTTON_SIZE.width,
            STAGE_HEIGHT - 22 - PRIMARY_BUTTON_SIZE.height, onContinue,
        );
        continueButton.on("tap", onContinue);
        this.group.add(homeButton, continueButton);
    }

    // Replace the reward content while keeping the buttons and background.
    render(page: TreasureRewardPage): void {
        this.content.destroyChildren();
        if (page.type === "clue") this.renderClue(page);
        else if (page.type === "treasure") this.renderTreasure(page.treasure);
        else this.renderUltimate();
        this.group.getLayer()?.batchDraw();
    }

    // Show a new clue and one progress marker for each level.
    private renderClue(page: TreasureRewardPage & { type: "clue" }): void {
        this.drawHeader("Treasure Hint");
        const clueText = [
            this.drawText("You found a clue:", 30, 0, 470, 38),
            this.drawText(page.clue, 30, 0, 470, 62),
            this.drawText("for the Golden Treasure", 30, 0, 470, 30),
        ];
        const gap = 24;
        const textHeight = clueText.reduce((height, text) => height + text.height(), 0)
            + gap * (clueText.length - 1);
        let y = (STAGE_HEIGHT - textHeight) / 2;
        for (const text of clueText) {
            text.align("center");
            text.y(y);
            y += text.height() + gap;
        }
        this.drawText("The Golden\nTreasure", 535, 95, 250, 39, PINK);
        this.drawProgress(page);
        this.drawChest(610, 270, false);
    }

    // Celebrate the five completed levels with the topic's configured treasure.
    private renderTreasure(treasure: TopicTreasureDefinition): void {
        this.drawHeader("Treasure Found");
        this.drawText(`You found the\ntreasure!\nA Golden\n${treasure.name}!`, 30, 125, 470, 51);
        this.drawText(`The Golden\n${treasure.name}`, 525, 95, 260, 39, PINK);
        switch (treasure.kind) {
            case "abacus": this.drawAbacus(); break;
            case "pencil": this.drawPencil(); break;
            case "calculator": this.drawCalculator(); break;
            case "scale": this.drawScale(); break;
        }
    }

    // Celebrate completing all four topics.
    private renderUltimate(): void {
        this.drawHeader("Ultimate Treasure Found");
        this.drawText("You did it!", 30, 125, 440, 62);
        this.drawText("You've completed\nthe adventure and\nunlocked the\nUltimate Treasure!", 30, 255, 440, 35);
        this.drawText("The Ultimate\nTreasure", 505, 95, 280, 42, PINK);
        this.drawChest(530, 285, true);
    }

    // Draw the title and divider shared by all three pages.
    private drawHeader(title: string): void {
        this.content.add(new Konva.Text({
            x: 0, y: 36, width: STAGE_WIDTH, text: title,
            fontFamily: FONT_FAMILY, fontSize: 22, fill: TITLE_COLOR, align: "center",
        }));
        this.content.add(new Konva.Line({ points: [25, 76, STAGE_WIDTH - 25, 76], stroke: "white", strokeWidth: 5 }));
    }

    // Draw completed levels as checks and remaining levels as numbers.
    private drawProgress(page: TreasureRewardPage): void {
        for (let i = 0; i < page.totalClues; i++) {
            const y = 235 + i * 46;
            if (i < page.totalClues - 1) {
                this.content.add(new Konva.Arrow({ points: [565, y + 17, 565, y + 28],
                    stroke: TITLE_COLOR, fill: TITLE_COLOR, pointerLength: 4, pointerWidth: 4 }));
            }
            this.content.add(new Konva.Circle({ x: 565, y, radius: 16, fill: GOLD }));
            this.content.add(new Konva.Text({
                x: 549, y: y - 16, width: 32, height: 32,
                text: i < page.cluesFound ? "✓" : String(i + 1),
                fontFamily: FONT_FAMILY, fontSize: 22, fill: TITLE_COLOR,
                align: "center", verticalAlign: "middle", listening: false,
            }));
        }
    }

    // Draw a gold chest, adding jewels and coins for ultimate treasure.
    private drawChest(x: number, y: number, ultimate: boolean): void {
        const chest = new Konva.Group({ x, y, scaleX: ultimate ? 1.35 : 1, scaleY: ultimate ? 1.35 : 1 });
        chest.add(new Konva.Rect({ width: 150, height: 110, cornerRadius: 14,
            fill: "#A85818", stroke: "#D69412", strokeWidth: 7 }));
        chest.add(new Konva.Rect({ width: 150, height: 48, cornerRadius: 14,
            fill: "#D48A27", stroke: GOLD, strokeWidth: 5 }));
        for (const bandX of [24, 112]) {
            chest.add(new Konva.Rect({ x: bandX, width: 14, height: 110, fill: GOLD }));
        }
        chest.add(new Konva.Rect({ x: 64, y: 45, width: 25, height: 30, cornerRadius: 5, fill: GOLD }));
        chest.add(new Konva.Circle({ x: 77, y: 56, radius: 4, fill: TITLE_COLOR }));
        if (ultimate) {
            for (let i = 0; i < 5; i++) {
                chest.add(new Konva.Circle({ x: 12 + i * 30, y: 112, radius: 13, fill: GOLD, stroke: "#D69412" }));
            }
            chest.add(new Konva.RegularPolygon({ x: 76, y: 22, sides: 4, radius: 25,
                fill: PINK, stroke: GOLD, strokeWidth: 5 }));
        }
        this.content.add(chest);
    }

    // Draw a calculator with a display and a four-by-four keypad.
    private drawCalculator(): void {
        const calculator = new Konva.Group({ x: 575, y: 230 });
        calculator.add(new Konva.Rect({ width: 155, height: 225, cornerRadius: 20,
            fill: GOLD, stroke: "#BD7812", strokeWidth: 5 }));
        calculator.add(new Konva.Rect({ x: 14, y: 15, width: 127, height: 43,
            cornerRadius: 7, fill: "#FFF5DD", stroke: TITLE_COLOR, strokeWidth: 2 }));
        const labels = ["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "−", "0", ".", "=", "+"];
        for (let i = 0; i < labels.length; i++) {
            const x = 13 + (i % 4) * 33;
            const y = 75 + Math.floor(i / 4) * 34;
            calculator.add(new Konva.Rect({ x, y, width: 28, height: 28, cornerRadius: 5,
                fill: "#FFF5DD", stroke: "#BD7812" }));
            calculator.add(new Konva.Text({ x, y: y + 3, width: 28, text: labels[i],
                fontSize: 22, fontFamily: FONT_FAMILY, fill: TITLE_COLOR, align: "center" }));
        }
        this.content.add(calculator);
    }

    private drawAbacus(): void {
        const abacus = new Konva.Group({ x: 550, y: 230 });
        abacus.add(new Konva.Rect({ width: 200, height: 225, cornerRadius: 22,
            fill: GOLD, stroke: "#BD7812", strokeWidth: 4 }));
        abacus.add(new Konva.Rect({ x: 14, y: 14, width: 172, height: 197, cornerRadius: 12,
            fill: "#FFF5DD", stroke: "#BD7812", strokeWidth: 3 }));
        for (let row = 0; row < 4; row++) {
            const y = 45 + row * 45;
            abacus.add(new Konva.Rect({ x: 16, y: y - 3, width: 168, height: 6,
                fill: "#E6A519", stroke: "#BD7812", cornerRadius: 3 }));
            for (let column = 0; column < 4; column++) {
                abacus.add(new Konva.Rect({ x: 24 + column * 40, y: y - 19,
                    width: 30, height: 38, cornerRadius: 15, stroke: "#BD7812", strokeWidth: 2,
                    fillLinearGradientStartPoint: { x: 0, y: 0 },
                    fillLinearGradientEndPoint: { x: 30, y: 38 },
                    fillLinearGradientColorStops: [0, "#FFF3AA", 0.5, GOLD, 1, "#E6A519"] }));
            }
        }
        abacus.add(new Konva.Line({ points: [22, 7, 175, 7], stroke: "#FFFBE8", strokeWidth: 3,
            lineCap: "round" }));
        this.content.add(abacus);
    }

    private drawPencil(): void {
        const pencil = new Konva.Group({ x: 535, y: 445, rotation: -42 });
        pencil.add(new Konva.Rect({ x: 245, y: -18, width: 24, height: 36, cornerRadius: 8,
            fill: "#FFF0BE", stroke: "#BD7812", strokeWidth: 2 }));
        pencil.add(new Konva.Line({ points: [0, 0, 45, -21, 45, 21], closed: true,
            fill: "#FFE5A1", stroke: "#BD7812", strokeWidth: 2 }));
        pencil.add(new Konva.Line({ points: [0, 0, 13, -6, 13, 6], closed: true,
            fill: "#59534A" }));
        pencil.add(new Konva.Rect({ x: 45, y: -21, width: 180, height: 42,
            fill: GOLD, stroke: "#BD7812", strokeWidth: 2 }));
        pencil.add(new Konva.Line({ points: [46, 12, 224, 12, 224, 21, 46, 21], closed: true,
            fill: "#E6A519" }));
        pencil.add(new Konva.Line({ points: [52, -14, 218, -14], stroke: "#FFFBE8", strokeWidth: 4,
            lineCap: "round" }));
        pencil.add(new Konva.Rect({ x: 225, y: -22, width: 24, height: 44,
            fill: "#E6A519", stroke: "#BD7812", strokeWidth: 2 }));
        for (const x of [231, 242]) {
            pencil.add(new Konva.Line({ points: [x, -20, x, 20], stroke: GOLD, strokeWidth: 3 }));
        }
        pencil.add(new Konva.Star({ x: 95, y: 1, numPoints: 4, innerRadius: 3, outerRadius: 11,
            fill: "#FFFBE8" }));
        this.content.add(pencil);
    }

    private drawScale(): void {
        const scale = new Konva.Group({ x: 520, y: 230 });
        scale.add(new Konva.Rect({ x: 121, y: 22, width: 18, height: 180,
            fill: GOLD, stroke: "#BD7812", strokeWidth: 3 }));
        scale.add(new Konva.Rect({ x: 95, y: 187, width: 70, height: 24, cornerRadius: 12,
            fill: GOLD, stroke: "#BD7812", strokeWidth: 3 }));
        scale.add(new Konva.Rect({ x: 60, y: 202, width: 140, height: 26, cornerRadius: 13,
            fill: GOLD, stroke: "#BD7812", strokeWidth: 3 }));
        scale.add(new Konva.Circle({ x: 130, y: 12, radius: 16,
            fill: GOLD, stroke: "#BD7812", strokeWidth: 3 }));
        scale.add(new Konva.Rect({ x: 30, y: 28, width: 200, height: 18, cornerRadius: 7,
            fill: GOLD, stroke: "#BD7812", strokeWidth: 3 }));
        for (const centerX of [55, 205]) {
            for (const rimX of [centerX - 45, centerX + 45]) {
                scale.add(new Konva.Line({ points: [centerX, 47, rimX, 125],
                    stroke: "#BD7812", strokeWidth: 3 }));
            }
            scale.add(new Konva.Path({ x: centerX - 55, y: 125, data: "M0 0 Q55 55 110 0 Z",
                fill: GOLD, stroke: "#BD7812", strokeWidth: 3 }));
            for (const offset of [-17, 0, 17]) {
                scale.add(new Konva.Circle({ x: centerX + offset, y: 117, radius: 9,
                    fill: GOLD, stroke: "#BD7812", strokeWidth: 2 }));
            }
            scale.add(new Konva.Ellipse({ x: centerX, y: 125, radiusX: 55, radiusY: 5,
                fill: GOLD, stroke: "#FFF3AA", strokeWidth: 2 }));
        }
        scale.add(new Konva.Circle({ x: 130, y: 36, radius: 13,
            fill: GOLD, stroke: "#BD7812", strokeWidth: 3 }));
        scale.add(new Konva.Line({ points: [126, 58, 126, 180], stroke: "#FFFBE8", strokeWidth: 3,
            lineCap: "round" }));
        this.content.add(scale);
    }

    // Add themed text to the current reward content.
    private drawText(text: string, x: number, y: number, width: number, fontSize: number, fill = TITLE_COLOR): Konva.Text {
        const label = new Konva.Text({ x, y, width, text, fontSize, fill,
            fontFamily: FONT_FAMILY, lineHeight: 1.3, listening: false });
        this.content.add(label);
        return label;
    }

    // Show this screen and redraw its layer.
    show(): void { this.group.show(); this.group.getLayer()?.batchDraw(); }

    // Hide this screen and restore the normal cursor.
    hide(): void { this.group.hide(); document.body.style.cursor = "default"; this.group.getLayer()?.batchDraw(); }

    // Expose the root group for the application's Konva layer.
    getGroup(): Konva.Group { return this.group; }
}
