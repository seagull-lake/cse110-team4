import type {
    SolvedMainGameProblem,
    SubtractionColumn,
} from "../../problem-engine/MainGameProblemGenerator.ts";

const PLACE_NAMES = ["ones", "tens", "hundreds", "thousands", "ten thousands"];

/** One page of the subtraction solution: the columns revealed so far, from the ones place up. */
export interface SubtractionPage {
    /** The number on top and the number under it. For a negative answer this is larger − smaller. */
    readonly top: number;
    readonly bottom: number;
    /** True when the problem was smaller − larger, so the answer gets a minus. */
    readonly isNegative: boolean;
    readonly columns: readonly SubtractionColumn[];
    readonly visibleColumnCount: number;
    /** The column explained on this page (the last one revealed). */
    readonly currentColumn: SubtractionColumn;
    readonly hasNext: boolean;
    /** Only on the last page. */
    readonly finalAnswer?: number;
}

function placeName(index: number): string {
    return PLACE_NAMES[index] ?? `10^${index}`;
}

/**
 * What happens in one column, e.g. "Ones: 4 is smaller than 8, so borrow 1 from the tens. 14 − 8 = 6".
 * A column that lent 1 to the column before shows it as "− 1".
 */
export function explainSubtractionColumn(column: SubtractionColumn, index: number): string {
    const name = placeName(index);
    const lent = column.borrowIn ? ` (lent 1 to the ${placeName(index - 1)})` : "";
    const minusLent = column.borrowIn ? " − 1" : "";
    const label = `${name[0].toUpperCase()}${name.slice(1)}${lent}: `;
    if (!column.borrowOut) {
        return `${label}${column.leftDigit}${minusLent} − ${column.rightDigit} = ${column.resultDigit}`;
    }
    return `${label}${column.leftDigit}${minusLent} is smaller than ${column.rightDigit}, ` +
        `so borrow 1 from the ${placeName(index + 1)}. ` +
        `${column.leftDigit + 10}${minusLent} − ${column.rightDigit} = ${column.resultDigit}`;
}

export class SolutionScreenModel{
    private readonly problem: SolvedMainGameProblem;

    private stepIndex = 0;
    private columnIndex = 0;
    private divisionBoxIndex = 0;
    private multiplicationRowIndex = 0;
    private additionPageIndex = 0;
    private subtractionColumnIndex = 0;

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

    // Return the addition data and how many columns should be filled in.
    // Which page to draw, and whether "Next Step" can go further.
    getAdditionPage() {
        const step = this.getCurrentStep();
        const columns = step.additionColumns;
        if (!columns) throw new Error("The current solution step is not addition.");
        return {
            step,                                               // the view reads the digits from this
            pageIndex: this.additionPageIndex,
            hasNext: this.additionPageIndex < columns.length,   // false only on the Full Solution page
        };
    }

    // Move to the next page, stopping at the Full Solution page.
    nextAdditionPage(): void {
        if (this.getAdditionPage().hasNext) this.additionPageIndex++;
    }
    
    // Return the subtraction columns revealed so far, one more on every Next Step.
    getSubtractionPage(): SubtractionPage {
        const step = this.getCurrentStep();
        const columns = step.subtractionColumns;
        if (!columns) throw new Error("The current solution step is not subtraction.");
        const isNegative = step.leftOperand < step.rightOperand;
        const hasNext = this.subtractionColumnIndex < columns.length - 1;
        return {
            top: isNegative ? step.rightOperand : step.leftOperand,
            bottom: isNegative ? step.leftOperand : step.rightOperand,
            isNegative,
            columns,
            visibleColumnCount: this.subtractionColumnIndex + 1,
            currentColumn: columns[this.subtractionColumnIndex],
            hasNext,
            finalAnswer: hasNext ? undefined : this.getFinalAnswer(),
        };
    }

    // Reveal one more column, stopping at the last one.
    nextSubtractionPage(): void {
        if (this.getSubtractionPage().hasNext) this.subtractionColumnIndex++;
    }
}
