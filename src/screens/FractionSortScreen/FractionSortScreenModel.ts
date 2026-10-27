interface Fraction {
    numerator: number;
    denominator: number;
    value: number;
}

export const FRACTION_COUNT = 11;   // 1 main + 10 draggable
export const MAX_DENOMINATOR = 12;

export class FractionSortScreenModel {
    //score
    private score = 0;

    // list of fractions, main fraction in index 0, 
    // following fractions are the user draggable fractions (current count is 10)
    private fractions: Fraction[] = [];
    private random: () => number;

    // Random source is injectable so tests can make it predictable
    constructor(random: () => number = Math.random) {
        this.random = random;
    }

    // Random integer in [min, max], inclusive
    private randInt(min: number, max: number): number {
        return min + Math.floor(this.random() * (max - min + 1));
    }

    //Make Fraction
    makeFraction(): Fraction {
        const denominator = this.randInt(2,MAX_DENOMINATOR);
        const numerator = this.randInt(1, denominator-1);
        return {numerator:numerator, denominator:denominator, value:numerator/denominator};
    }

    // Create Random Fraction generator
        // 1 main fractions
        // 10 choice fractions
    generateFractions():void{
        this.fractions = [];
        for (let i = 0; i < FRACTION_COUNT; i++){
            this.fractions.push(this.makeFraction());
        }
    }

    // Fraction Getter Methos 
    getMainFraction(): Fraction { return this.fractions[0]; }
    getChoiceFractions(): Fraction[] { return this.fractions.slice(1); }
    getFractions(): Fraction[] { return [...this.fractions]; }


    //Score Getter Methods
    getScore(): number{
        return this.score;
    }
}