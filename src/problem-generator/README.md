# Problem generator

The diagram defines five modules: Game Interpreter, Main Game Generator,
Multiplication/Division Generator, Fraction Generator, and Validator. This first
step implements the Game Interpreter and the contracts for its three generators.
Concrete generators, validation of player answers, and screen integration are
subsequent steps.

`GameInterpreter` accepts the three generators through its constructor. Their input and output types are
defined in the plain `Generators` interface in `types.ts`. Calling `generate(request)` selects
exactly one generator and returns its problem and solution. The interpreter
validates the request, including a required `digits` pair of positive safe integers.
For example, `[2, 1]` requests a two-digit first operand and a one-digit second
operand. Each generator uses these counts to choose its numeric ranges.
Arithmetic games require `operation`; the fraction comparison game omits it.
Game identifiers match the existing screen identifiers. Requests do not require
a `difficulty` field.

```ts
import { GameInterpreter } from "./GameInterpreter.ts";
import type { Generators } from "./types.ts";

// Supply the concrete generator implementations when they are available.
function createProblem(generators: Generators) {
    const interpreter = new GameInterpreter(generators);
    return interpreter.generate({
        game: "multidivgame",
        digits: [2, 1],
        operation: "division",
    });
}
```

Main-game problems contain operands, operation, and a numeric fill-in answer.
Multiplication/division problems also contain four answer choices and an
`isCorrect` tuple with four booleans in the same order. For example,
`choices: [3, 6, 9, 12]`, `answer: 6`, and
`isCorrect: [false, true, false, false]` mark the second option as correct.
Generators must supply these flags by comparing each choice with the numeric answer;
the interpreter passes them through with the problem. Fraction
problems contain a reference fraction, choice fractions, and the expected bin
for each choice (in matching order). Generator implementations must ensure that
multiple-choice answers are unique and include the correct answer exactly once,
and that fraction denominators are positive. Solutions should stay in the model
for the future Validator; views should receive only the prompt and choices.

Unsupported modules, operations, and invalid or missing digit counts
throw before any generator is called. Missing or non-callable generators fail at
construction. Generator errors propagate to
the caller so controllers can decide how to report them.

## 简单说明

### 游戏解释器

`generate` 只有一个定义，不使用函数重载、泛型或类型映射。

1. 检查输入是否包含两个合法的数字位数。
2. 用 `if / else` 判断 `request.game`。
3. 检查运算类型，把完整请求交给对应生成器。
4. 返回生成器给出的题目。

例如 `game: "multidivgame"` 会调用
`this.generators.multidivgame.generate(request)`。
`GameRequest` 表示输入的数据，`GameProblem` 表示可能返回的三种题目之一。
