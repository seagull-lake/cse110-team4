import type { Group } from "konva/lib/Group";

export interface View {
    getGroup(): Group;
    show(): void;
    hide(): void;
}

// Add one variant per screen; add fields to pass data between screens
export type Screen =
    { type: "menu" } |
    { type: "maingame" } |
    { type: "fractiongame" } |
    { type: "multidivgame"};

export abstract class ScreenController {
    abstract getView(): View;
    show(): void { this.getView().show(); }
    hide(): void { this.getView().hide(); }
}

export interface ScreenSwitcher {
    switchToScreen(screen: Screen): void;
}