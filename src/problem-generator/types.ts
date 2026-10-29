// Supported game types, difficulties, and arithmetic operations.
export type GameModule = "maingame" | "multidivgame" | "fractiongame";
export type Difficulty = "easy" | "medium" | "hard";
export type Operation = "addition" | "subtraction" | "multiplication" | "division";

export interface GameRequest { // to be taken in
    game: GameModule;
    digits:[number,number];
    operation?: Operation; // optional because fraction comprison dont need operation
}

export interface MainGameProblem { // to be returned
    game: "maingame";
    operands: [number, number];
    operation: Operation;
    answer: number;
}

export interface MultiplicationDivisionProblem {// to be returned
    game: "multidivgame";
    operands: [number, number];
    operation: "multiplication" | "division";
    answer: number;
    choices: [number, number, number, number];
    // Match choices by index: true marks the correct option, false marks an incorrect option.
    isCorrect: [boolean, boolean, boolean, boolean];
}

export interface Fraction {
    numerator: number;
    denominator: number;
}

export type FractionComparison = "lesser" | "greater" | "equal to";

export interface FractionProblem {// to be returned
    game: "fractiongame";
    reference: Fraction;
    choices: Fraction[];
    answers: FractionComparison[];
}

export type GameProblem = MainGameProblem | MultiplicationDivisionProblem | FractionProblem;

// take in game setting and return a problem
export interface MainGameGenerator {
    generate(request: GameRequest): MainGameProblem;
}

// take in game setting and return a problem
export interface MultiplicationDivisionGenerator {
    generate(request: GameRequest): MultiplicationDivisionProblem;
}

// take in game setting and return a problem
export interface FractionGenerator {
    generate(request: GameRequest): FractionProblem;
}

// group the three generators for use by GameInterpreter.
export interface Generators {
    maingame: MainGameGenerator;
    multidivgame: MultiplicationDivisionGenerator;
    fractiongame: FractionGenerator;
}
