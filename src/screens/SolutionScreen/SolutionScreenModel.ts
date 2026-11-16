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

export class SolutionScreenModel {
    private readonly problem: SolvedMainGameProblem;

    private stepIndex = 0;
    private columnIndex = 0;
    private divisionBoxIndex = 0;
    private multiplicationRowIndex = 0;
    private additionPageIndex = 0;
    private subtractionColumnIndex = 0;

    /** Own the routed problem and start from its first page. */
    constructor(problem: SolvedMainGameProblem) {
        this.problem = problem;
    }

    /** Return the original problem supplied by gameplay. */
    getProblem(): SolvedMainGameProblem {
        return this.problem;
    }

    /** Read the operands from the routed problem. */
    getOperand() {
        return this.problem.operands;
    }

    /** Read the final answer computed by the generator. */
    getFinalAnswer() {
        return this.problem.solution.finalAnswer;
    }

    /** Read the active arithmetic step. */
    getCurrentStep() {
        return this.problem.solution.steps[this.stepIndex];
    }

    /** Read the active addition column. */
    getCurrentColumn() {
        return this.getCurrentStep().additionColumns?.[this.columnIndex];
    }

    /** Expose the addition columns revealed so far. */
    getVisibleColumns() {
        const columns = this.getCurrentStep().additionColumns;
        if (!columns) return [];
        return columns.slice(0, this.columnIndex + 1);
    }

    /** Check whether another addition column remains. */
    hasNextColumn() {
        const columns = this.getCurrentStep().additionColumns;
        if (!columns) return false;
        return this.columnIndex < columns.length - 1;
    }

    /** Reveal one more addition column when available. */
    nextColumn() {
        if (this.hasNextColumn()) {
            this.columnIndex++;
        }
    }

    /** Expose the division data and revealed box count. */
    getDivisionPage() {
        const division = this.getCurrentStep().divisionBoxMethod;
        if (!division) throw new Error("The current solution step is not division.");
        return {
            division,
            visibleBoxCount: this.divisionBoxIndex + 1,
            hasNext: this.divisionBoxIndex < division.boxes.length - 1,
        };
    }

    /** Reveal one more division box when available. */
    nextDivisionPage(): void {
        if (this.getDivisionPage().hasNext) this.divisionBoxIndex++;
    }

    /** Expose revealed products or the separate final answer. */
    getMultiplicationPage() {
        const rows = this.getCurrentStep().multiplicationRows;
        if (!rows) {
            throw new Error("The current solution step is not multiplication.");
        }
        const hasNext = this.multiplicationRowIndex < rows.length;
        return {
            currentRow: hasNext ? rows[this.multiplicationRowIndex] : undefined,
            visibleRows: rows.slice(0, this.multiplicationRowIndex + 1),
            hasNext,
            finalAnswer: hasNext ? undefined : this.getFinalAnswer(),
        };
    }

    /** Reveal the next product or final-answer page. */
    nextMultiplicationPage(): void {
        if (this.getMultiplicationPage().hasNext) {
            this.multiplicationRowIndex++;
        }
    }

    /** Expose the current addition column or Full Solution page. */
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

    /** Advance addition, stopping on Full Solution. */
    nextAdditionPage(): void {
        if (this.getAdditionPage().hasNext) this.additionPageIndex++;
    }

    /** Expose revealed subtraction columns and borrow explanations. */
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

    /** Reveal one more subtraction column when available. */
    nextSubtractionPage(): void {
        if (this.getSubtractionPage().hasNext) this.subtractionColumnIndex++;
    }
}
