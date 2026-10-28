import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_HEIGHT,STAGE_WIDTH } from "../../constants.ts";
import { createHomeButton } from "../../components/HomeButton.ts";
import type { Bin, Fraction } from "./FractionSortScreenModel.ts";

export class FractionSortScreenView implements View {
    private group: Konva.Group;

    constructor(
        onHomeClick: () => void,
        onDrop: (index: number, bin: Bin | null) => void,
        onSubmit: () => void,
        onContinue: () => void
    ) {
        this.group = new Konva.Group({ visible: false });

        // add Konva shapes (background, bins, timer/score text, Submit + Continue buttons) here
        // - Submit button:   .on("click", onSubmit)
        // - Continue button: .on("click", onContinue)
        // - each fraction:   .on("dragend", () => onDrop(index, this.whichBin(x, y)))
        void onDrop; void onSubmit; void onContinue;   // remove once the shapes above use them

        // Home button — added last so it's drawn on top of everything else
        this.group.add(createHomeButton(onHomeClick, STAGE_WIDTH - 50, STAGE_HEIGHT - 50));
    }

    /*------ Called by the controller (fill these in) ------*/

    // Draw the main fraction and the 10 draggable choices (replace last round's shapes)
    showFractions(main: Fraction, choices: Fraction[]): void { void main; void choices; }

    // Fractions draggable, Submit visible, Continue + results text hidden
    showSortingMode(): void { }

    // Lock dragging, color each choice green/red, show "x/10 correct" and Continue, hide Submit
    showResults(results: boolean[], correct: number): void { void results; void correct; }

    updateTimer(secondsLeft: number): void { void secondsLeft; }
    updateScore(score: number): void { void score; }

    show(): void { this.group.visible(true); this.group.getLayer()?.draw(); }
    hide(): void { this.group.visible(false); this.group.getLayer()?.draw(); }
    getGroup(): Konva.Group { return this.group; }
}