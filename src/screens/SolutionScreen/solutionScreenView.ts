import Konva from "konva";
import type { AdditionColumn, SolutionStep, DivisionBoxMethod } from "../../problem-engine/MainGameProblemGenerator.ts";
import type { MainGameProblem } from "../../domain/problem.ts";
import { AdditionSolutionView } from "./AdditionSolutionView.ts";
import { SubtractionSolutionView } from "./SubtractionSolutionView.ts";
import type { SubtractionPage } from "./SolutionScreenModel.ts";
import type { SolutionPage } from "./SolutionScreenModel.ts";
import { DivisionSolutionView } from "./DivisionSolutionView.ts";
import { MultiplicationSolutionView } from "./MultiplicationSolutionView.ts";


interface SolutionViewData {
    step: SolutionStep;
    currentColumn: AdditionColumn | undefined;
    visibleColumns: readonly AdditionColumn[];
    hasNextColumn: boolean;
}

export class SolutionScreenView {
    private readonly group: Konva.Group;
    private readonly content: Konva.Group;
    private readonly divisionView: DivisionSolutionView;
    private readonly multiplicationView: MultiplicationSolutionView;
    private readonly additionView: AdditionSolutionView;
    private readonly subtractionView: SubtractionSolutionView;

    /** Create reusable operation views with shared navigation callbacks. */
    constructor(onNextStep: () => void, onHome: () => void, onBackToMap: () => void) {
        this.divisionView = new DivisionSolutionView(onNextStep);
        this.additionView = new AdditionSolutionView(onNextStep, onHome, onBackToMap);
        this.subtractionView = new SubtractionSolutionView(onNextStep);
        this.multiplicationView = new MultiplicationSolutionView(onHome, onBackToMap, onNextStep);

        this.group = new Konva.Group({ visible: false });
        this.content = new Konva.Group();

        this.group.add(this.content);
    }

    /** Detach the previous operation while keeping its view reusable. */
    render(_data: SolutionViewData): void {
        this.content.removeChildren();// Detach reusable operation groups.
        this.group.getLayer()?.batchDraw();// Redraw the layer to reflect the changes
    }

    // Keep the division View alive while redrawing the revealed boxes.
    renderDivision(division: DivisionBoxMethod, visibleBoxCount: number): void {
        this.content.removeChildren();
        this.content.add(this.divisionView.getGroup());
        this.divisionView.render(division, visibleBoxCount);
    }

    /** Attach the multiplication view and draw its current page. */
    renderMultiplication(level: number, problem: MainGameProblem,
        page: Extract<SolutionPage, { operation: "multiplication" }>, explanation: string): void {
        this.content.removeChildren();
        this.content.add(this.multiplicationView.getGroup());
        this.multiplicationView.render(level, problem, page, explanation);
    }

    // Same idea as renderDivision: keep the addition view alive and redraw its page.
    renderAddition(step: SolutionStep, pageIndex: number, level?: number): void {
        this.content.removeChildren();
        this.content.add(this.additionView.getGroup());
        this.additionView.render(step, pageIndex, level);
    }

    // Keep the subtraction View alive while redrawing the revealed columns.
    renderSubtraction(page: SubtractionPage): void {
        this.content.removeChildren();
        this.content.add(this.subtractionView.getGroup());
        this.subtractionView.render(page);
    }

    /** Show the solution group and request a redraw. */
    show(): void {
        this.group.show();
        this.group.getLayer()?.batchDraw();
    }

    /** Hide the solution group when another screen opens. */
    hide(): void {
        this.group.hide();
        this.group.getLayer()?.batchDraw();
    }

    /** Expose the solution group for the application layer. */
    getGroup(): Konva.Group {
        return this.group;
    }

}
