import {
    ADDITION_LEVELS, SUBTRACTION_LEVELS, MULTIPLICATION_LEVELS, DIVISION_LEVELS,
} from "../../levels/levelConfig.ts";
import type { LevelDefinition, LevelType } from "../../levels/levelConfig.ts";
import type { MainGameProblem } from "../../domain/problem.ts";
import type { ProblemDispatcher } from "../../problem-engine/ProblemDispatcher.ts";

export interface Topic {
    readonly label: string;
    readonly level: LevelDefinition;
}

// Same order as the Figma "Choose a Topic" screen; adding a topic here adds a button
const TOPICS: readonly Topic[] = [
    { label: "Addition", level: ADDITION_LEVELS },
    { label: "Subtraction", level: SUBTRACTION_LEVELS },
    { label: "Multiplication", level: MULTIPLICATION_LEVELS },
    { label: "Division", level: DIVISION_LEVELS },
];

export class MainGameScreenModel {
    private selectedTopic: LevelType | null = null;

    getTopics(): readonly Topic[] {
        return TOPICS;
    }

    getLevelFor(topic: LevelType): LevelDefinition {
        const match = TOPICS.find((t) => t.level.type === topic);
        if (!match) throw new Error(`Unknown topic: ${topic}`);
        return match.level;
    }

    selectTopic(topic: LevelType): void {
        this.getLevelFor(topic); // throws on an unknown topic
        this.selectedTopic = topic;
    }

    getSelectedTopic(): LevelType | null {
        return this.selectedTopic;
    }

    generateProblem(difficulty: number, dispatcher: ProblemDispatcher): MainGameProblem {
        if (this.selectedTopic === null) {
            throw new Error("Choose a topic before generating a problem.");
        }
        const problem = dispatcher.generate({
            gameType: "main-game",
            operation: this.selectedTopic,
            difficulty,
        });
        if (!("answer" in problem)) {
            throw new Error("Expected a main-game problem.");
        }
        return problem;
    }
}
