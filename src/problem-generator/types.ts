// 支持的游戏、难度和运算。
export type GameModule = "maingame" | "multidivgame" | "fractiongame";
export type Difficulty = "easy" | "medium" | "hard";
export type Operation = "addition" | "subtraction" | "multiplication" | "division";

// 调用 generate 时传入的数据。分数游戏不需要 operation。
export interface GameRequest {
    game: GameModule;
    difficulty: Difficulty;
    operation?: Operation;
}

export interface MainGameProblem {
    game: "maingame";
    operands: [number, number];
    operation: Operation;
    answer: number;
}

export interface MultiplicationDivisionProblem {
    game: "multidivgame";
    operands: [number, number];
    operation: "multiplication" | "division";
    answer: number;
    choices: [number, number, number, number];
}

export interface Fraction {
    numerator: number;
    denominator: number;
}

export type FractionComparison = "lesser" | "greater" | "equal to";

export interface FractionProblem {
    game: "fractiongame";
    reference: Fraction;
    choices: Fraction[];
    answers: FractionComparison[];
}

// 返回的题目可以是这三种中的一种。
export type GameProblem = MainGameProblem | MultiplicationDivisionProblem | FractionProblem;

// 三个生成器都接收请求，然后返回各自的题目。
export interface Generators {
    maingame: { generate(request: GameRequest): MainGameProblem };
    multidivgame: { generate(request: GameRequest): MultiplicationDivisionProblem };
    fractiongame: { generate(request: GameRequest): FractionProblem };
}
