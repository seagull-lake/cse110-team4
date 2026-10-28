import type { GameProblem, GameRequest, Generators } from "./types.ts";

export class GameInterpreter {
    private generators: Generators;

    // 保存三个生成器，之后根据游戏类型选择其中一个。
    constructor(generators: Generators) {
        if (!generators?.maingame?.generate ||
            !generators?.multidivgame?.generate ||
            !generators?.fractiongame?.generate) {
            throw new TypeError("All three generators are required.");
        }
        this.generators = generators;
    }

    generate(request: GameRequest): GameProblem {
        if (!request || typeof request !== "object") {
            throw new TypeError("A game request is required.");
        }

        if (request.difficulty !== "easy" &&
            request.difficulty !== "medium" &&
            request.difficulty !== "hard") {
            throw new RangeError("Unsupported difficulty. Use easy, medium, or hard.");
        }

        if (request.game === "maingame") {
            if (request.operation !== "addition" &&
                request.operation !== "subtraction" &&
                request.operation !== "multiplication" &&
                request.operation !== "division") {
                throw new RangeError("Unsupported main-game operation.");
            }
            return this.generators.maingame.generate(request);
        }
        else if (request.game === "multidivgame") {
            if (request.operation !== "multiplication" && request.operation !== "division") {
                throw new RangeError("This game requires multiplication or division.");
            }
            return this.generators.multidivgame.generate(request);
        }
        // 分数小游戏：调用分数生成器。
        else if (request.game === "fractiongame") {
            return this.generators.fractiongame.generate(request);
        }
        else {
            throw new RangeError("Unsupported game module.");
        }
    }
}
