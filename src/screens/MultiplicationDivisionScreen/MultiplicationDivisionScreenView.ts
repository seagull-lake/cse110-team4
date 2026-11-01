// Imports
import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_HEIGHT,STAGE_WIDTH } from "../../constants.ts";
import { createHomeButton } from "../../components/HomeButton.ts";

// Constants
const FONT = "Arial";                // swap for your Google Font once it's loaded in index.html
const COLORS = {
    background: "#fdf3dc",
    button: "#fbe7a9",
    choice: "#3b6b5e",
    choiceText: "#ffffff",
    correct: "#3f9a5b",
    divider: "#ffffff",
    finalScoreText: "#3b6b5e",
    highlight: "#e0a030",
    muted: "#8a7f6a",
    text: "#3b2f0b",
    timerOutline: "#3b2f0b",
    timerRemaining: "#3b2f0b",
    timerUsed: "#ffffff",
};
const PAD = 30;                      // left/right margin
const TIMER_BAR_WIDTH = 100;
const TIMER_BAR_HEIGHT = 5;
const BUTTON = { width: 170, height: 45, x: STAGE_WIDTH - PAD - 170, y: STAGE_HEIGHT - 70 };
const CHOICE_COUNT = 4;              // there are 4 answer choices
const CHOICE = { width: 250, height: 80, gapX: 25, gapY: 40, y: 300, radius: 20 };
const PROBLEM = { width: 110, fontSize: 40, operatorWidth: 30, firstOperandY: 122, secondOperandY: 180, lineY: 236, linePad: 10 };
const COMBO = { y: 152, fontSize: 22, rightMargin: 90 };

export class MultiplicationDivisionScreenView implements View {
    // Konva Groups
    private group: Konva.Group;           // always shown
    private gameGroup: Konva.Group;       // everything shown while playing
    private choicesGroup: Konva.Group;    // answer choices group
    private gameOverGroup: Konva.Group;   // "Game Over" screen

    // Timer
    private timerBar: Konva.Rect;
    private timerText: Konva.Text;

    // Scoring
    private highScoreText: Konva.Text;
    private scoreText: Konva.Text;
    private earnedText: Konva.Text;

    // Round
    private roundText: Konva.Text;

    // Problem
    private firstOperandText: Konva.Text;
    private secondOperandText: Konva.Text;
    private operatorText: Konva.Text;
    private problemLine: Konva.Line;

    // Combo
    private comboText: Konva.Text;

    // Answer Choices
    private choiceTexts: Konva.Text[] = [];

    // Game Over Scoring
    private finalScoreText: Konva.Text;
    private finalHighScoreText: Konva.Text;
    private newHighScoreText: Konva.Text;

    constructor(
        onHomeClick: () => void,
        onPlayAgain: () => void,
        onChoiceClick: (index: number) => void
    ) {
        ///////////////////////////////////////////////////////////////////////
        ///////////////////////////// Group Start /////////////////////////////
        ///////////////////////////////////////////////////////////////////////

        this.group = new Konva.Group({ visible: false });

        // Background
        this.group.add(new Konva.Rect({ x: 0, y: 0, width: STAGE_WIDTH, height: STAGE_HEIGHT, fill: COLORS.background }));

        // Title
        this.group.add(this.text("Multiplication + Division", 0, 30, 15, { width: STAGE_WIDTH, align: "center" }));

        // Divider
        this.group.add(new Konva.Line({ points: [PAD, 60, STAGE_WIDTH - PAD, 60], stroke: COLORS.divider, strokeWidth: 5 }));

        // Home Button
        this.group.add(createHomeButton(onHomeClick, PAD, STAGE_HEIGHT - 62));
        
        ///////////////////////////////////////////////////////////////////////
        ////////////////////////////// Group End //////////////////////////////
        ///////////////////////////////////////////////////////////////////////



        ///////////////////////////////////////////////////////////////////////
        /////////////////////////// Game Group Start //////////////////////////
        ///////////////////////////////////////////////////////////////////////

        this.gameGroup = new Konva.Group();
        this.group.add(this.gameGroup);
        
        // Timer Background
        this.gameGroup.add(new Konva.Rect({ x: PAD, y: 16, width: TIMER_BAR_WIDTH, height: TIMER_BAR_HEIGHT, fill: COLORS.timerUsed, stroke: COLORS.timerOutline, strokeWidth: 1 }));

        // Timer Bar
        this.timerBar = new Konva.Rect({ x: PAD, y: 16, width: TIMER_BAR_WIDTH, height: TIMER_BAR_HEIGHT, fill: COLORS.timerRemaining });
        this.gameGroup.add(this.timerBar);

        // Timer Text
        this.timerText = this.text("Time: 1:00", PAD, 26, 20);
        this.gameGroup.add(this.timerText);

        // High Score Text
        this.highScoreText = this.text("Highscore: 0", 0, 10, 16, { width: STAGE_WIDTH - PAD, align: "right", fill: COLORS.muted });
        this.gameGroup.add(this.highScoreText);

        // Score Text
        this.scoreText = this.text("Points: 0", 0, 28, 20, { width: STAGE_WIDTH - PAD, align: "right" });
        this.gameGroup.add(this.scoreText);

        // Earned Text
        this.earnedText = this.text("", 0, 68, 14, { width: STAGE_WIDTH - PAD, align: "right", fill: COLORS.correct, fontStyle: "bold" });
        this.gameGroup.add(this.earnedText);

        // Round Text
        this.roundText = this.text("Q1", PAD, 70, 15, { fontStyle: "bold" });
        this.gameGroup.add(this.roundText);

        const problemX = (STAGE_WIDTH - PROBLEM.width) / 2;

        // First Operand Text
        this.firstOperandText = this.text("12", problemX, PROBLEM.firstOperandY, PROBLEM.fontSize, { width: PROBLEM.width, align: "right", wrap: "none" });
        this.gameGroup.add(this.firstOperandText);

        // Operator Text
        this.operatorText = this.text("x", problemX, PROBLEM.secondOperandY, PROBLEM.fontSize, { width: PROBLEM.operatorWidth, align: "left", wrap: "none" });
        this.gameGroup.add(this.operatorText);
        
        // Second Operand Text
        this.secondOperandText = this.text("5", problemX + PROBLEM.operatorWidth, PROBLEM.secondOperandY, PROBLEM.fontSize, { width: PROBLEM.width - PROBLEM.operatorWidth, align: "right", wrap: "none" });
        this.gameGroup.add(this.secondOperandText);
        
        // Problem Line
        this.problemLine = new Konva.Line({ points: [problemX - PROBLEM.linePad, PROBLEM.lineY, problemX + PROBLEM.width + PROBLEM.linePad, PROBLEM.lineY], stroke: COLORS.text, strokeWidth: 4 });
        this.gameGroup.add(this.problemLine);

        // Combo Text
        this.comboText = this.text("Combo: 0", 0, COMBO.y, COMBO.fontSize, { width: STAGE_WIDTH - COMBO.rightMargin, align: "right" });
        this.gameGroup.add(this.comboText);

        ///////////////////////////////////////////////////////////////////////
        //////////////////////////// Game Group End ///////////////////////////
        ///////////////////////////////////////////////////////////////////////



        ///////////////////////////////////////////////////////////////////////
        ////////////////////// Answer Choices Group Start /////////////////////
        ///////////////////////////////////////////////////////////////////////

        this.choicesGroup = new Konva.Group();
        this.gameGroup.add(this.choicesGroup);

        // Answer Choices
        for (let i = 0; i < CHOICE_COUNT; i++) {
            const { x, y } = this.choicePosition(i);
            const box = new Konva.Group({ x, y });
            box.add(new Konva.Rect({ width: CHOICE.width, height: CHOICE.height, fill: COLORS.choice, cornerRadius: CHOICE.radius }));
            const label = this.text("?", 0, 0, 28, { width: CHOICE.width, height: CHOICE.height, align: "center", verticalAlign: "middle", fill: COLORS.choiceText });
            box.add(label);
            box.on("click", () => onChoiceClick(i));
            box.on("mouseenter", () => { document.body.style.cursor = "pointer"; });
            box.on("mouseleave", () => { document.body.style.cursor = "default"; });
            this.choicesGroup.add(box);
            this.choiceTexts.push(label);
        }

        ///////////////////////////////////////////////////////////////////////
        /////////////////////// Answer Choices Group End //////////////////////
        ///////////////////////////////////////////////////////////////////////



        ///////////////////////////////////////////////////////////////////////
        //////////////////////// Game Over Group Start ////////////////////////
        ///////////////////////////////////////////////////////////////////////

        this.gameOverGroup = new Konva.Group({ visible: false });
        this.group.add(this.gameOverGroup);

        // Game Over Text
        this.gameOverGroup.add(this.text("Game Over", 0, 190, 60, { width: STAGE_WIDTH, align: "center", fontStyle: "bold" }));

        // Game Over Score Text
        this.finalScoreText = this.text("", 0, 270, 34, { width: STAGE_WIDTH, align: "center", fill: COLORS.finalScoreText, fontStyle: "bold" });
        this.gameOverGroup.add(this.finalScoreText);

        // Game Over Highscore Text
        this.finalHighScoreText = this.text("", 0, 320, 18, { width: STAGE_WIDTH, align: "center", fill: COLORS.muted });
        this.gameOverGroup.add(this.finalHighScoreText);

        // Game Over New Highscore Text
        this.newHighScoreText = this.text("New Highscore!", 0, 318, 30, { width: STAGE_WIDTH, align: "center", fill: COLORS.highlight, fontStyle: "bold" });
        this.gameOverGroup.add(this.newHighScoreText);

        // Play Again Button
        const playAgainButton = this.makeButton("Play Again", BUTTON.x, BUTTON.y);
        playAgainButton.on("click", onPlayAgain);
        this.gameOverGroup.add(playAgainButton);

        ///////////////////////////////////////////////////////////////////////
        ///////////////////////// Game Over Group End /////////////////////////
        ///////////////////////////////////////////////////////////////////////
    }

    /*------ Called by the controller ------*/

    showGame(): void {
        this.gameOverGroup.visible(false);
        this.gameGroup.visible(true);
        document.body.style.cursor = "default";
        this.redraw();
    }

    showProblem(firstOperand: number, operator: string, secondOperand: number): void {
        this.firstOperandText.text(String(firstOperand));
        this.operatorText.text(operator);
        this.secondOperandText.text(String(secondOperand));
        this.redraw();
    }

    showChoices(values: number[]): void {
        values.forEach((value, i) => this.choiceTexts[i]?.text(String(value)));
        this.redraw();
    }

    showEarned(points: number): void {
        this.earnedText.text(points > 0 ? `+${points}` : "");
        this.redraw();
    }

    // Hide the game, show Game Over with the final score and high score
    showGameOver(finalScore: number, highScore: number, isNewHighScore: boolean): void {
        this.finalScoreText.text(`Total Points: ${finalScore}`);
        this.finalHighScoreText.text(`Highscore: ${highScore}`).visible(!isNewHighScore);
        this.newHighScoreText.visible(isNewHighScore);
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

    updateRound(round: number): void {
        this.roundText.text(`Q${round}`);
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

    updateCombo(combo: number): void {
        this.comboText.text(`Combo: ${combo}`);
        this.redraw();
    }

    show(): void { this.group.visible(true); this.group.getLayer()?.draw(); }
    hide(): void { this.group.visible(false); this.group.getLayer()?.draw(); }
    getGroup(): Konva.Group { return this.group; }

    /*------ Helpers ------*/

    private makeButton(label: string, x: number, y: number): Konva.Group {
        const button = new Konva.Group({ x, y });
        button.add(new Konva.Rect({ width: BUTTON.width, height: BUTTON.height, fill: COLORS.button, stroke: COLORS.text, strokeWidth: 3, cornerRadius: 8 }));
        button.add(this.text(label, 0, 0, 22, { width: BUTTON.width, height: BUTTON.height, align: "center", verticalAlign: "middle" }));
        button.on("mouseenter", () => { document.body.style.cursor = "pointer"; });
        button.on("mouseleave", () => { document.body.style.cursor = "default"; });
        return button;
    }

    // Calculates top-left corner of choice `index` in the 2x2 grid, centered on the stage
    private choicePosition(index: number): { x: number; y: number } {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const gridWidth = 2 * CHOICE.width + CHOICE.gapX;
        const startX = (STAGE_WIDTH - gridWidth) / 2;
        return {
            x: startX + col * (CHOICE.width + CHOICE.gapX),
            y: CHOICE.y + row * (CHOICE.height + CHOICE.gapY),
        };
    }

    private text(value: string, x: number, y: number, fontSize: number, extra: Konva.TextConfig = {}): Konva.Text {
        return new Konva.Text({ text: value, x, y, fontSize, fontFamily: FONT, fill: COLORS.text, ...extra });
    }

    private redraw(): void {
        this.group.getLayer()?.batchDraw();
    }
}