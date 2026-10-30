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
    correct: "#3f9a5b",
    divider: "#ffffff",
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

export class MultiplicationDivisionScreenView implements View {
    // Konva Groups
    private group: Konva.Group;           // always shown
    private gameGroup: Konva.Group;       // everything shown while playing
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

    constructor(onHomeClick: () => void, onPlayAgain: () => void) {
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

        ///////////////////////////////////////////////////////////////////////
        //////////////////////////// Game Group End ///////////////////////////
        ///////////////////////////////////////////////////////////////////////
        // add Konva shapes (background, game elements) to this.group here
        this.scoreText = new Konva.Text({
            x: 0,
            y: 20,
            width: STAGE_WIDTH - 30,
            text: "Points: 0",
            fontSize: 20,
            fontFamily: "Arial",
            fill: "#3b2f0b",
            align: "right",
        });
        this.group.add(this.scoreText);



        ///////////////////////////////////////////////////////////////////////
        //////////////////////// Game Over Group Start ////////////////////////
        ///////////////////////////////////////////////////////////////////////

        this.gameOverGroup = new Konva.Group({ visible: false });
        this.group.add(this.gameOverGroup);

        // Game Over Text
        this.gameOverGroup.add(this.text("Game Over", 0, 190, 60, { width: STAGE_WIDTH, align: "center", fontStyle: "bold" }));

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

    // Hide the game, show Game Over with the final score and high score
    showGameOver(): void {
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
        this.group.getLayer()?.draw();
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

    private text(value: string, x: number, y: number, fontSize: number, extra: Konva.TextConfig = {}): Konva.Text {
        return new Konva.Text({ text: value, x, y, fontSize, fontFamily: FONT, fill: COLORS.text, ...extra });
    }

    private redraw(): void {
        this.group.getLayer()?.batchDraw();
    }
}