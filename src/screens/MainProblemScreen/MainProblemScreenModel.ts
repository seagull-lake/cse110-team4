import { getLevelDefinition } from "../../levels/levelConfig.ts";
import type { LevelDefinition, LevelType } from "../../levels/levelConfig.ts";
import type { MainGameProblem, ProblemRequest } from "../../domain/problem.ts";
import { MainGameProblemGenerator } from "../../problem-engine/MainGameProblemGenerator.ts";
import { MultiplicationDivisionGenerator } from "../../problem-engine/MultiplicationDivisionGenerator.ts";
import { ProblemDispatcher } from "../../problem-engine/ProblemDispatcher.ts";

/** The dispatcher the game uses; tests pass their own. */
export function createProblemDispatcher(): ProblemDispatcher {
  return new ProblemDispatcher(new MainGameProblemGenerator(), new MultiplicationDivisionGenerator());
}

/** The level being played (topic and difficulty) and the problem generated for it. */
export class MainProblemScreenModel {
  private readonly level: LevelDefinition;
  private readonly difficulty: number;
  private readonly problem: MainGameProblem;
  private answerCorrect = false;

  constructor(topic: LevelType, difficulty: number, dispatcher: ProblemDispatcher = createProblemDispatcher()) {
    this.level = getLevelDefinition(topic);
    if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > this.level.maxDifficulty) {
      throw new Error(`${topic} has no difficulty ${difficulty}.`);
    }
    this.difficulty = difficulty;
    // The main-game request always returns a MainGameProblem (operands + answer)
    this.problem = dispatcher.generate(this.getProblemRequest()) as MainGameProblem;
  }

  /** What this level asks the problem generator for. */
  getProblemRequest(): ProblemRequest {
    return { gameType: "main-game", operation: this.level.type, difficulty: this.difficulty };
  }

  getTopic(): LevelType { return this.level.type; }
  getDifficulty(): number { return this.difficulty; }
  getProblem(): MainGameProblem { return this.problem; }

  /** Returns true only when every entered answer character matches the generated answer. */
  checkAnswer(digits: readonly string[]): boolean {
    const expected = String(this.problem.answer);
    this.answerCorrect = digits.length === expected.length &&
      Array.from(expected, (digit, index) => digits[index] === digit).every(Boolean);
    return this.answerCorrect;
  }

  canContinue(): boolean { return this.answerCorrect; }

  /** e.g. "Addition – Level 3" */
  getTitle(): string {
    const topic = this.level.type;
    return `${topic[0].toUpperCase()}${topic.slice(1)} – Level ${this.difficulty}`;
  }
}
