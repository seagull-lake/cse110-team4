import type{ SolvedMainGameProblem } from "../../problem-engine/MainGameProblemGenerator.ts";

export class SolutionScreenModel{
    private readonly problem: SolvedMainGameProblem;

    private stepIndex = 0;
    private columnIndex = 0;
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
    


}