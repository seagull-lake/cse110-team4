import type { AdditionColumn, SubtractionColumn, MultiplicationRow, DivisionBoxMethod } from "../../problem-engine/MainGameProblemGenerator.ts";

export type SolutionPage = {
    hasNext: boolean;
    finalAnswer?: number;
} & (
    | { operation: "addition"; currentColumn: AdditionColumn | undefined; visibleColumns: readonly AdditionColumn[] }
    | { operation: "subtraction"; currentColumn: SubtractionColumn | undefined; visibleColumns: readonly SubtractionColumn[] }
    | { operation: "multiplication"; currentRow: MultiplicationRow | undefined; visibleRows: readonly MultiplicationRow[] }
    | { operation: "division"; division: DivisionBoxMethod; visibleBoxCount: number }
);
