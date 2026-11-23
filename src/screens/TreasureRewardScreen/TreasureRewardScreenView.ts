import Konva from "konva";
import type { View } from "../../types.ts";
import { createHomeButton, createPrimaryButton, PRIMARY_BUTTON_SIZE } from "../../components/ComponentFactory.ts";
import { FONT_FAMILY, STAGE_WIDTH, STAGE_HEIGHT, TITLE_COLOR } from "../../constants.ts";
import type { TreasureRewardPage } from "./TreasureRewardScreenModel.ts";

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
            "Continue →", STAGE_WIDTH - 30 - PRIMARY_BUTTON_SIZE.width,
            STAGE_HEIGHT - 22 - PRIMARY_BUTTON_SIZE.height, onContinue,
        );
        continueButton.on("tap", onContinue);
        this.group.add(homeButton, continueButton);
    }

    // Replace the reward content while keeping the buttons and background.
    render(page: TreasureRewardPage): void {
        this.content.destroyChildren();
        if (page.type === "clue") this.renderClue(page);
        else if (page.type === "treasure") this.renderTreasure();
        else this.renderUltimate();
        this.group.getLayer()?.batchDraw();
    }

    // Show a new clue and one progress marker for each level.
    private renderClue(page: TreasureRewardPage): void {
        this.drawHeader("Treasure Hint");
        this.drawText("You found a\nClue for the\nGolden Treasure", 30, 155, 470, 55);
        this.drawText("The Golden\nTreasure", 535, 95, 250, 39, PINK);
        this.drawProgress(page);
        this.drawChest(610, 270, false);
    }

    // Celebrate the five completed levels with a golden calculator.
    private renderTreasure(): void {
        this.drawHeader("Treasure Found");
        this.drawText("You found the\ntreasure!\nA Golden\nCalculator!", 30, 125, 470, 51);
        this.drawText("The Golden\nCalculator", 525, 95, 260, 39, PINK);
        this.drawCalculator();
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

    // Add themed text to the current reward content.
    private drawText(text: string, x: number, y: number, width: number, fontSize: number, fill = TITLE_COLOR): void {
        this.content.add(new Konva.Text({ x, y, width, text, fontSize, fill,
            fontFamily: FONT_FAMILY, lineHeight: 1.3, listening: false }));
    }

    // Show this screen and redraw its layer.
    show(): void { this.group.show(); this.group.getLayer()?.batchDraw(); }

    // Hide this screen and restore the normal cursor.
    hide(): void { this.group.hide(); document.body.style.cursor = "default"; this.group.getLayer()?.batchDraw(); }

    // Expose the root group for the application's Konva layer.
    getGroup(): Konva.Group { return this.group; }
}
