/*
    To implment in this file:
    - Fraction Generator
    - Answer Checker
    - Score Manager (get current score, compare with high score, and send it to storage)
*/
import { loadFractionHighScore, saveFractionHighScore } from "../../storage.ts";

export interface Fraction {
    numerator: number;
    denominator: number;
    value: number;
}

export type Bin = "lesser" | "greater" | "equal to"

export const FRACTION_COUNT = 4;   // 1 main + 3 draggable
export const CHOICE_COUNT = FRACTION_COUNT - 1;
export const MAX_DENOMINATOR = 12;
export const POINTS_PER_CORRECT = 50;

export class FractionSortScreenModel {
    //scores
    private score = 0;
    private highScore = loadFractionHighScore();
    private round = 0;


    // list of fractions, main fraction in index 0, 
    // following fractions are the user draggable fractions (current count is 10)
    private fractions: Fraction[] = [];

    // where the user has put each choice fraction this round (null = not placed yet)
    // placements[i] belongs to getChoiceFractions()[i]
    private placements: (Bin | null)[] = [];

    private random: () => number;


    /*------ Fraction Generator ------*/

    // Random source is injectable so tests can make it predictable
    constructor(random: () => number = Math.random) {
        this.random = random;
    }

    // Random integer in [min, max], inclusive
    private randInt(min: number, max: number): number {
        return min + Math.floor(this.random() * (max - min + 1));
    }

    //Make Fraction, generate a numerator and denominator, and get divide them to get fraction value
    makeFraction(): Fraction {
        const denominator = this.randInt(2,MAX_DENOMINATOR);
        const numerator = this.randInt(1, denominator-1);
        return {numerator:numerator, denominator:denominator, value:numerator/denominator};
    }

    // Generate Fractions and add them to the list of fractions
    generateFractions():void{
        this.fractions = [];
        for (let i = 0; i < FRACTION_COUNT; i++){
            this.fractions.push(this.makeFraction());
        }
    }

    // Fraction Getter Methods 
    getMainFraction(): Fraction { return this.fractions[0]; }
    getChoiceFractions(): Fraction[] { return this.fractions.slice(1); }
    getFractions(): Fraction[] { return [...this.fractions]; }

    /*------ Round Manager ------*/
    
    // New fractions + clear all placements (called at the start of every round)
    newRound(): void {
        this.round++;
        this.generateFractions();
        this.placements = new Array(CHOICE_COUNT).fill(null);
    }

    getRound(): number{ return this.round; }

    // Record where the user dropped a fraction
    setPlacement(choice_index: number, bin: Bin | null): void{
        this.placements[choice_index] = bin;
    }

    getPlacements(): (Bin | null)[] { return [...this.placements]; }

    // How many choice fractions are not in a bin yet
    getRemainingCount(): number {
        return this.placements.filter(p => p === null).length;
    }

    /*------ Answer Checker -------*/

    //Check fraction and returns if fraction is in the right bin(true) or wrong (false)
    //Method only checks if a fraction is lesser/greater/equal to, does not look through bins
    checkPlacement(choice_index: number, bin: Bin): boolean {
        const choice = this.getChoiceFractions()[choice_index];
        if (!choice) return false;
        const main = this.getMainFraction().value;
        if(bin === "equal to") return main === choice.value;
        return bin === "lesser"? main > choice.value : main < choice.value;
    }

    // Is the user's current placement for this fraction correct? (unplaced = wrong)
    isCorrect(choice_index: number): boolean {
        const bin = this.placements[choice_index];
        return bin !== null && bin !== undefined && this.checkPlacement(choice_index, bin);
    }

    // Results for every choice fraction, in order (for coloring green/red)
    getResults(): boolean[] {
        return this.placements.map((_, i) => this.isCorrect(i));
    }

    // True only if every choice fraction is in the right bin
    allCorrect(): boolean {
        return this.getResults().every(r => r);
    }

    // Check everything, add points, and return how many were correct this round
    submit(): number {
        const correct = this.getResults().filter(r => r).length;
        this.score += correct * POINTS_PER_CORRECT;
        return correct * POINTS_PER_CORRECT;
    }

    /*------ Score Manager ------*/

    //Score Getter Methods
    getScore(): number{ return this.score; }
    getHighScore(): number { return this.highScore; }

    //fresh game
    resetGame(): void { 
        this.score = 0; 
        this.round = 0;
    }

    // End of game: save a new high score. Returns true if this score is a new high score.
    finishGame(): boolean {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            saveFractionHighScore(this.highScore);
            return true;
        }
        return false;
    }
}