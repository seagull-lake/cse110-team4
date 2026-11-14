import type { MultiplicationRow } from "../../problem-engine/MainGameProblemGenerator.ts";

/** Data the multiplication template needs; all arithmetic comes from the Problem Engine. */
export interface MultiplicationSolutionViewData {
    readonly multiplicand: number;
    readonly multiplier: number;
    readonly visibleRows: readonly MultiplicationRow[];
    readonly currentRow: MultiplicationRow;
    readonly finalAnswer?: number;
}
