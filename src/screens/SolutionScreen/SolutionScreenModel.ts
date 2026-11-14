import type {
    SolvedMainGameProblem,
    AdditionColumn, SubtractionColumn, MultiplicationRow, DivisionBoxMethod,
} from "../../problem-engine/MainGameProblemGenerator.ts";

export type SolutionPage = {
    hasNext: boolean;
    finalAnswer?: number;
} & (
    | { operation: "addition"; currentColumn: AdditionColumn | undefined; visibleColumns: readonly AdditionColumn[] }
    | { operation: "subtraction"; currentColumn: SubtractionColumn | undefined; visibleColumns: readonly SubtractionColumn[] }
    | { operation: "multiplication"; currentRow: MultiplicationRow | undefined; visibleRows: readonly MultiplicationRow[] }
    | { operation: "division"; division: DivisionBoxMethod; visibleBoxCount: number }
);

export class SolutionScreenModel{
    private readonly problem: SolvedMainGameProblem;

    private stepIndex = 0;
    private columnIndex = 0;
    private divisionBoxIndex = 0;
    private multiplicationRowIndex = 0;
    constructor(problem: SolvedMainGameProblem){
        this.problem = problem;
    }

    getOperand(){
        return this.problem.operands;
    }

    getFinalAnswer(){
        return this.problem.solution.finalAnswer;
    }

    getCurrentStep(){
        return this.problem.solution.steps[this.stepIndex];
    }

    getCurrentColumn(){
        return this.getCurrentStep().additionColumns?.[this.columnIndex];
    }

    getVisibleColumns(){//this returns the columns that should be visible on the screeen 
        const columns = this.getCurrentStep().additionColumns;
        if(!columns) return [];
        return columns.slice(0, this.columnIndex + 1);
    }  

    hasNextColumn(){
        const columns = this.getCurrentStep().additionColumns;
        if(!columns) return false;
        return this.columnIndex < columns.length - 1;
    }

    nextColumn(){
        if(this.hasNextColumn()){
            this.columnIndex++;
        }
    }

    getCurrentPage(): SolutionPage {
        const step = this.getCurrentStep();
        switch (step.operation) {
            case "multiplication": return this.getMultiplicationPage();
            case "division": {
                const page = this.getDivisionPage();
                return { operation: "division", ...page, finalAnswer: page.hasNext ? undefined : this.getFinalAnswer() };
            }
            case "addition": {
                const hasNext = this.hasNextColumn();
                return {
                    operation: "addition", currentColumn: this.getCurrentColumn(),
                    visibleColumns: this.getVisibleColumns(), hasNext,
                    finalAnswer: hasNext ? undefined : this.getFinalAnswer(),
                };
            }
            case "subtraction": {
                const columns = step.subtractionColumns;
                if (!columns) throw new Error("The current solution step has no subtraction columns.");
                const hasNext = this.columnIndex < columns.length - 1;
                return {
                    operation: "subtraction", currentColumn: columns[this.columnIndex],
                    visibleColumns: columns.slice(0, this.columnIndex + 1), hasNext,
                    finalAnswer: hasNext ? undefined : this.getFinalAnswer(),
                };
            }
        }
    }

    nextPage(): void {
        const page = this.getCurrentPage();
        if (!page.hasNext) return;
        switch (page.operation) {
            case "multiplication": this.nextMultiplicationPage(); break;
            case "division": this.nextDivisionPage(); break;
            case "addition": this.nextColumn(); break;
            case "subtraction": this.columnIndex++; break;
        }
    }

    // Return the division data and how many boxes should be filled in.
    getDivisionPage() {
        const division = this.getCurrentStep().divisionBoxMethod;
        if (!division) throw new Error("The current solution step is not division.");
        return {
            division,
            visibleBoxCount: this.divisionBoxIndex + 1,
            hasNext: this.divisionBoxIndex < division.boxes.length - 1,
        };
    }

    nextDivisionPage(): void {
        if (this.getDivisionPage().hasNext) this.divisionBoxIndex++;
    }

    getMultiplicationPage(): Extract<SolutionPage, { operation: "multiplication" }> {
        const rows = this.getCurrentStep().multiplicationRows;
        if (!rows) {
            throw new Error("The current solution step is not multiplication.");
        }
        const hasNext = this.multiplicationRowIndex < rows.length;
        return {
            operation: "multiplication",
            currentRow: hasNext ? rows[this.multiplicationRowIndex] : undefined,
            visibleRows: rows.slice(0, this.multiplicationRowIndex + 1),
            hasNext,
            finalAnswer: hasNext ? undefined : this.getFinalAnswer(),
        };
    }

    nextMultiplicationPage(): void {
        if (this.getMultiplicationPage().hasNext) {
            this.multiplicationRowIndex++;
        }
    }

}
