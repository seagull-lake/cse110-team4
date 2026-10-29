import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_HEIGHT,STAGE_WIDTH } from "../../constants.ts";
import { createHomeButton } from "../../components/HomeButton.ts";
import type { Bin, Fraction } from "./FractionSortScreenModel.ts";

const FONT = "Arial";                // swap for your Google Font once it's loaded in index.html
const COLORS = {
    background: "#fdf3dc",
    text: "#3b2f0b",
    muted: "#8a7f6a",
    divider: "#ffffff",
    tray: "#ffffff",
    bin: "#3b6b5e",
    tile: "#3b6b5e",
    tileText: "#ffffff",
    correct: "#3f9a5b",
    wrong: "#c8473d",
    button: "#fbe7a9",
    highlight: "#e0a030",
};

const PAD = 30;                      // left/right margin
const TIMER_BAR_WIDTH = 100;

const TRAY = { x: PAD, y: 180, width: STAGE_WIDTH - PAD * 2, height: 122 };
const TILE = { width: 55, height: 48, gap: 15 };

const BIN_Y = 316;
const BIN_HEIGHT = 186;
const BIN_GAP = 25;
const BIN_WIDTH = (STAGE_WIDTH - PAD * 2 - BIN_GAP * 2) / 3;

const BUTTON = { width: 170, height: 45, x: STAGE_WIDTH - PAD - 170, y: STAGE_HEIGHT - 70 };

// Order of the bins on screen, left to right (matches the mockup)
const BIN_ORDER: { bin: Bin; symbol: string; label: string }[] = [
    { bin: "lesser", symbol: "<", label: "Less than" },
    { bin: "equal to", symbol: "=", label: "Equal to" },
    { bin: "greater", symbol: ">", label: "Greater than" },
];

export class FractionSortScreenView implements View {
    private group: Konva.Group;
    private gameGroup: Konva.Group;       // everything shown while playing
    private gameOverGroup: Konva.Group;   // "Game Over" screen

    // callbacks from the controller
    private onDrop: (index: number, bin: Bin | null) => void;
    private onSubmit: () => void;
    private onContinue: () => void;

    // header
    private timerBar: Konva.Rect;
    private timerText: Konva.Text;
    private highScoreText: Konva.Text;
    private scoreText: Konva.Text;
    private earnedText: Konva.Text;
    private roundText: Konva.Text;

    // main fraction
    private mainNumerator: Konva.Text;
    private mainDenominator: Konva.Text;

    // tray
    private statusText: Konva.Text;       // "3 fractions remaining" / "Correct Answer" / "Wrong Answer"
    private totalText: Konva.Text;        // "TOTAL POINTS: 50" after submit
    private placeholders: Konva.Group;    // "Empty" boxes left behind in the tray
    private tilesGroup: Konva.Group;      // draggable fraction tiles (rebuilt every round)
    private tiles: Konva.Group[] = [];
    private tileBackgrounds: Konva.Rect[] = [];

    // bins
    private bins: { bin: Bin; rect: Konva.Rect; label: Konva.Text; symbol: string; labelPrefix: string }[] = [];

    // Submit / Continue button (same button, two modes)
    private actionText: Konva.Text;
    private mode: "sorting" | "results" = "sorting";

    // game over
    private finalScoreText: Konva.Text;
    private finalHighScoreText: Konva.Text;
    private newHighScoreText: Konva.Text;

    constructor(
        onHomeClick: () => void,
        onDrop: (index: number, bin: Bin | null) => void,
        onSubmit: () => void,
        onContinue: () => void,
        onPlayAgain: () => void
    ) {
        this.onDrop = onDrop;
        this.onSubmit = onSubmit;
        this.onContinue = onContinue;

        this.group = new Konva.Group({ visible: false });
        this.group.add(new Konva.Rect({ x: 0, y: 0, width: STAGE_WIDTH, height: STAGE_HEIGHT, fill: COLORS.background }));

        // Title (shown on both the game and game over screens)
        this.group.add(this.text("Fraction Sort", 0, 30, 15, { width: STAGE_WIDTH, align: "center" }));

        this.gameGroup = new Konva.Group();
        this.group.add(this.gameGroup);

        /*--- Header ---*/
        this.gameGroup.add(new Konva.Rect({ x: PAD, y: 16, width: TIMER_BAR_WIDTH, height: 5, fill: COLORS.divider, stroke: COLORS.text, strokeWidth: 1 }));
        this.timerBar = new Konva.Rect({ x: PAD, y: 16, width: TIMER_BAR_WIDTH, height: 5, fill: COLORS.text });
        this.gameGroup.add(this.timerBar);
        this.timerText = this.text("Time: 1:00", PAD, 26, 20);
        this.gameGroup.add(this.timerText);

        this.highScoreText = this.text("Highscore: 0", 0, 10, 16, { width: STAGE_WIDTH - PAD, align: "right", fill: COLORS.muted });
        this.scoreText = this.text("Points: 0", 0, 28, 20, { width: STAGE_WIDTH - PAD, align: "right" });
        this.earnedText = this.text("", 0, 68, 14, { width: STAGE_WIDTH - PAD, align: "right", fill: COLORS.correct, fontStyle: "bold" });
        this.gameGroup.add(this.highScoreText, this.scoreText, this.earnedText);

        this.gameGroup.add(new Konva.Line({ points: [PAD, 60, STAGE_WIDTH - PAD, 60], stroke: COLORS.divider, strokeWidth: 5 }));
        this.roundText = this.text("Q1", PAD, 70, 15, { fontStyle: "bold" });
        this.gameGroup.add(this.roundText);

        /*--- Main fraction ---*/
        this.mainNumerator = this.text("", 0, 75, 38, { width: STAGE_WIDTH, align: "center" });
        this.mainDenominator = this.text("", 0, 125, 38, { width: STAGE_WIDTH, align: "center" });
        this.gameGroup.add(this.mainNumerator, this.mainDenominator);
        this.gameGroup.add(new Konva.Line({ points: [STAGE_WIDTH / 2 - 30, 119, STAGE_WIDTH / 2 + 30, 119], stroke: COLORS.text, strokeWidth: 3 }));

        /*--- Tray ---*/
        this.gameGroup.add(new Konva.Rect({ ...TRAY, fill: COLORS.tray, stroke: COLORS.text, strokeWidth: 2, cornerRadius: 12 }));
        this.gameGroup.add(this.text("Drag and Drop in Correct Bin", TRAY.x, TRAY.y + 12, 12, { width: TRAY.width, align: "center" }));
        this.statusText = this.text("", TRAY.x, TRAY.y + 29, 10, { width: TRAY.width, align: "center", fill: COLORS.muted });
        this.totalText = this.text("", TRAY.x, TRAY.y + 44, 10, { width: TRAY.width, align: "center", fill: COLORS.correct, fontStyle: "bold" });
        this.gameGroup.add(this.statusText, this.totalText);
        this.placeholders = new Konva.Group();
        this.gameGroup.add(this.placeholders);

        /*--- Bins ---*/
        BIN_ORDER.forEach(({ bin, symbol, label }, i) => {
            const x = PAD + i * (BIN_WIDTH + BIN_GAP);
            const rect = new Konva.Rect({ x, y: BIN_Y, width: BIN_WIDTH, height: BIN_HEIGHT, fill: COLORS.bin, cornerRadius: 8 });
            const symbolText = this.text(symbol, x, BIN_Y + 16, 24, { width: BIN_WIDTH, align: "center", fill: COLORS.tileText });
            const labelText = this.text(label, x, BIN_Y + 48, 11, { width: BIN_WIDTH, align: "center", fill: COLORS.tileText });
            this.gameGroup.add(rect, symbolText, labelText);
            this.bins.push({ bin, rect, label: labelText, symbol, labelPrefix: label });
        });

        /*--- Tiles (added after the bins so they're drawn on top) ---*/
        this.tilesGroup = new Konva.Group();
        this.gameGroup.add(this.tilesGroup);

        /*--- Submit / Continue button ---*/
        const actionButton = this.makeButton("Submit", BUTTON.x, BUTTON.y);
        this.actionText = actionButton.findOne("Text") as Konva.Text;
        actionButton.on("click", () => {
            if (this.mode === "sorting") this.onSubmit();
            else this.onContinue();
        });
        this.gameGroup.add(actionButton);

        /*--- Game over ---*/
        this.gameOverGroup = new Konva.Group({ visible: false });
        this.gameOverGroup.add(this.text("Game Over", 0, 190, 60, { width: STAGE_WIDTH, align: "center", fontStyle: "bold" }));
        this.finalScoreText = this.text("", 0, 270, 34, { width: STAGE_WIDTH, align: "center", fill: COLORS.bin, fontStyle: "bold" });
        this.finalHighScoreText = this.text("", 0, 320, 18, { width: STAGE_WIDTH, align: "center", fill: COLORS.muted });
        this.newHighScoreText = this.text("New Highscore!", 0, 318, 30, { width: STAGE_WIDTH, align: "center", fill: COLORS.highlight, fontStyle: "bold" });
        this.gameOverGroup.add(this.finalScoreText, this.finalHighScoreText, this.newHighScoreText);
        const playAgainButton = this.makeButton("Play Again", BUTTON.x, BUTTON.y);
        playAgainButton.on("click", onPlayAgain);
        this.gameOverGroup.add(playAgainButton);
        this.group.add(this.gameOverGroup);

        // Home button — added last so it's drawn on top of everything else
        this.group.add(createHomeButton(onHomeClick, PAD, STAGE_HEIGHT - 62));
    }

    /*------ Called by the controller ------*/

    // Draw the main fraction and the 10 draggable choices (replace last round's shapes)
    showFractions(main: Fraction, choices: Fraction[], round: number): void { 
        this.roundText.text(`Q${round}`);
        this.mainNumerator.text(String(main.numerator));
        this.mainDenominator.text(String(main.denominator));
        const mainText = `${main.numerator}/${main.denominator}`;
        for (const b of this.bins) b.label.text(`${b.labelPrefix} ${mainText}`);

        // Remove last round's tiles and placeholders
        this.tilesGroup.destroyChildren();
        this.placeholders.destroyChildren();
        this.tiles = [];
        this.tileBackgrounds = [];

        choices.forEach((fraction, index) => {
            const home = this.trayPosition(index, choices.length);

            // "Empty" box that shows once the tile is dragged away
            const placeholder = new Konva.Group({ x: home.x, y: home.y });
            placeholder.add(new Konva.Rect({ width: TILE.width, height: TILE.height, stroke: "#d6d0c4", strokeWidth: 1, cornerRadius: 6 }));
            placeholder.add(this.text("Empty", 0, 0, 10, { width: TILE.width, height: TILE.height, align: "center", verticalAlign: "middle", fill: COLORS.muted }));
            this.placeholders.add(placeholder);

            // Draggable tile
            const tile = new Konva.Group({ x: home.x, y: home.y, draggable: true });
            const background = new Konva.Rect({ width: TILE.width, height: TILE.height, fill: COLORS.tile, cornerRadius: 6 });
            tile.add(background);
            this.addFractionText(tile, fraction);

            tile.on("mouseenter", () => { document.body.style.cursor = "grab"; });
            tile.on("mouseleave", () => { document.body.style.cursor = "default"; });
            tile.on("dragstart", () => tile.moveToTop());
            tile.on("dragend", () => {
                const centerX = tile.x() + TILE.width / 2;
                const centerY = tile.y() + TILE.height / 2;
                this.onDrop(index, this.whichBin(centerX, centerY));
            });

            this.tilesGroup.add(tile);
            this.tiles.push(tile);
            this.tileBackgrounds.push(background);
        });

        this.redraw();
    }

    // Move every tile to where the model says it is (a bin slot, or back to the tray)
    placeTiles(placements: (Bin | null)[]): void {
        const countInBin = new Map<Bin, number>();
        const totalInBin = new Map<Bin, number>();
        for (const p of placements) if (p) totalInBin.set(p, (totalInBin.get(p) ?? 0) + 1);

        placements.forEach((bin, index) => {
            const tile = this.tiles[index];
            if (!tile) return;
            if (bin === null) {
                const home = this.trayPosition(index, placements.length);
                tile.position(home);
            } else {
                const slot = countInBin.get(bin) ?? 0;
                countInBin.set(bin, slot + 1);
                tile.position(this.binPosition(bin, slot, totalInBin.get(bin) ?? 1));
            }
        });
        this.redraw();
    }

    updateRemaining(remaining: number): void {
        this.statusText.text(`${remaining} fraction${remaining === 1 ? "" : "s"} remaining`);
        this.redraw();
    }

    // Fractions draggable, Submit visible, Continue + results text hidden
    showSortingMode(): void { 
        this.mode = "sorting";
        this.actionText.text("Submit");
        this.statusText.fill(COLORS.muted).fontSize(10).fontStyle("normal");
        this.totalText.text("");
        this.earnedText.text("");
        for (const tile of this.tiles) tile.draggable(true);
        this.gameOverGroup.visible(false);
        this.gameGroup.visible(true);
        this.redraw();
    }

    // Lock dragging, color each choice green/red, show "x/10 correct" and Continue, hide Submit
    showResults(results: boolean[], allCorrect: boolean, earned: number, totalScore: number): void {
        this.mode = "results";
        this.actionText.text("Continue");

        results.forEach((correct, index) => {
            this.tiles[index]?.draggable(false);
            this.tileBackgrounds[index]?.fill(correct ? COLORS.correct : COLORS.wrong);
        });

        this.statusText
            .text(allCorrect ? "Correct Answer" : "Wrong Answer")
            .fill(allCorrect ? COLORS.correct : COLORS.wrong)
            .fontSize(12)
            .fontStyle("bold");
        this.totalText.text(`TOTAL POINTS: ${totalScore}`).fill(allCorrect ? COLORS.correct : COLORS.wrong);
        this.earnedText.text(earned > 0 ? `+${earned}` : "");
        document.body.style.cursor = "default";
        this.redraw(); 
    }

    // Hide the game, show Game Over with the final score and high score
    showGameOver(finalScore: number, highScore: number, isNewHighScore: boolean): void {
        this.finalScoreText.text(`Total Points: ${finalScore}`);
        this.finalHighScoreText.text(`Highscore: ${highScore}`).visible(!isNewHighScore);
        this.newHighScoreText.visible(isNewHighScore);
        for (const tile of this.tiles) tile.draggable(false);
        this.gameGroup.visible(false);
        this.gameOverGroup.visible(true);
        document.body.style.cursor = "default";
        this.redraw();
    }

    updateTimer(secondsLeft: number, totalSeconds: number): void { 
        const s = Math.max(0, secondsLeft);
        const minutes = Math.floor(s / 60);
        const seconds = String(s % 60).padStart(2, "0");
        this.timerText.text(`Time: ${minutes}:${seconds}`);
        this.timerBar.width(TIMER_BAR_WIDTH * s / totalSeconds);
        this.redraw();
    }

    updateScore(score: number): void {
        this.scoreText.text(`Points: ${score}`);
        this.redraw();
    }

    updateHighScore(highScore: number): void {
        this.highScoreText.text(`Highscore: ${highScore}`);
        this.redraw();
    }

    show(): void { this.group.visible(true); this.group.getLayer()?.draw(); }
    hide(): void { this.group.visible(false); this.group.getLayer()?.draw(); }
    getGroup(): Konva.Group { return this.group; }

    /*------ Helpers ------*/

    // Which bin contains the point (x, y)? null = none
    private whichBin(x: number, y: number): Bin | null {
        for (const { bin, rect } of this.bins) {
            const inX = x >= rect.x() && x <= rect.x() + rect.width();
            const inY = y >= rect.y() && y <= rect.y() + rect.height();
            if (inX && inY) return bin;
        }
        return null;
    }

    // Starting spot of tile `index` in the tray (tiles centered in a row)
    private trayPosition(index: number, count: number): { x: number; y: number } {
        const rowWidth = count * TILE.width + (count - 1) * TILE.gap;
        const startX = TRAY.x + (TRAY.width - rowWidth) / 2;
        return { x: startX + index * (TILE.width + TILE.gap), y: TRAY.y + 62 };
    }

    // Spot for the `slot`-th tile inside a bin (tiles centered in a row)
    private binPosition(bin: Bin, slot: number, count: number): { x: number; y: number } {
        const rect = this.bins.find(b => b.bin === bin)!.rect;
        const rowWidth = count * TILE.width + (count - 1) * TILE.gap;
        const startX = rect.x() + (rect.width() - rowWidth) / 2;
        return { x: startX + slot * (TILE.width + TILE.gap), y: rect.y() + 85 };
    }

    // numerator / line / denominator inside a tile
    private addFractionText(tile: Konva.Group, fraction: Fraction): void {
        const half = TILE.height / 2;
        tile.add(this.text(String(fraction.numerator), 0, 3, 14, { width: TILE.width, align: "center", fill: COLORS.tileText }));
        tile.add(new Konva.Line({ points: [TILE.width / 2 - 12, half, TILE.width / 2 + 12, half], stroke: COLORS.tileText, strokeWidth: 1.5 }));
        tile.add(this.text(String(fraction.denominator), 0, half + 4, 14, { width: TILE.width, align: "center", fill: COLORS.tileText }));
    }

    private makeButton(label: string, x: number, y: number): Konva.Group {
        const button = new Konva.Group({ x, y });
        button.add(new Konva.Rect({ width: BUTTON.width, height: BUTTON.height, fill: COLORS.button, stroke: COLORS.text, strokeWidth: 3, cornerRadius: 8 }));
        button.add(this.text(label, 0, 0, 22, { width: BUTTON.width, height: BUTTON.height, align: "center", verticalAlign: "middle" }));
        button.on("mouseenter", () => { document.body.style.cursor = "pointer"; });
        button.on("mouseleave", () => { document.body.style.cursor = "default"; });
        return button;
    }

    private text(value: string, x: number, y: number, fontSize: number, extra: Konva.TextConfig = {}): Konva.Text {
        return new Konva.Text({ text: value, x, y, fontSize, fontFamily: FONT, fill: COLORS.text, ...extra });
    }

    private redraw(): void {
        this.group.getLayer()?.batchDraw();
    }

}