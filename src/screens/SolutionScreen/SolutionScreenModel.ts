import type {
    SolvedMainGameProblem,
} from "../../problem-engine/MainGameProblemGenerator.ts";

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

    getCurrentColumn(){//this returns the current column that should be visible on the screen
        return this.getCurrentStep().additionColumns?.[this.columnIndex];
    }

    getVisibleColumns(){//this returns the columns that should be visible on the screeen 
        const columns = this.getCurrentStep().additionColumns;
        if(!columns) return [];
        return columns.slice(0, this.columnIndex + 1);
    }  

    hasNextColumn(){//check if there is a next column to reveal
        const columns = this.getCurrentStep().additionColumns;
        if(!columns) return false;
        return this.columnIndex < columns.length - 1;
    }

    nextColumn(){//reveal the next column, stopping at the last column
        if(this.hasNextColumn()){
            this.columnIndex++;
        }
    }

    
    getDivisionPage() {//get the current division page from the model
        const division = this.getCurrentStep().divisionBoxMethod;
        if (!division) throw new Error("The current solution step is not division.");
        return {
            division,
            visibleBoxCount: this.divisionBoxIndex + 1,
            hasNext: this.divisionBoxIndex < division.boxes.length - 1,
        };
    }

    // Reveal one more box, stopping at the last box.
    nextDivisionPage(): void {
        if (this.getDivisionPage().hasNext) this.divisionBoxIndex++;
    }

    getMultiplicationPage() {
        const rows = this.getCurrentStep().multiplicationRows;
        if (!rows) {
            throw new Error("The current solution step is not multiplication.");
        }
        const hasNext = this.multiplicationRowIndex < rows.length - 1;
        return {
            currentRow: rows[this.multiplicationRowIndex],
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
