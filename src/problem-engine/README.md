# Main Game

The main-game problem engine generates arithmetic questions and their solutions. A solution contains the final answer and the intermediate calculations. Addition also records each column's digits and carries so the screen can explain the calculation as a vertical sum.

## Pipeline

The implemented model-to-generator flow is:

```text
MainGameScreenModel
    | Selected operation and requested difficulty
    v
ProblemDispatcher
    | Looks up operand digits for the difficulty
    v
MainGameProblemGenerator.generate(parameters)
    | Generates operands and calculates the solution
    v
MainGameScreenModel.generateProblem(...)
    | Returns operands and answer
```

### Current implementation

- `MainGameProblemGenerator.ts` implements problem and solution generation. `ProblemDispatcher.ts` selects operand digits and routes the request.
- `MainGameScreenModel.ts` stores the selected topic and can request a problem from a dispatcher supplied by its caller. The controller currently handles topic selection only; it does not generate or display problems or check answers.
- `generateProblem` returns the shared `MainGameProblem` type (`operands` and `answer`). The generator also produces `solution`, but the dispatcher and model do not expose it in their return types yet.

## Generator input

The dispatcher passes `ResolvedProblemParameters` to the generator:

```ts
{
  operation: "addition",
  operandDigits: [2, 2],
}
```

`operandDigits` specifies how many digits each operand has. For example, `[2, 1, 2]` requests three operands: a two-digit number, a one-digit number, and another two-digit number.

Supported operations are `addition`, `subtraction`, `multiplication`, and `division`.

The generator requires at least two operands. Each digit count must be an integer from 1 to 15. Generated operands are positive integers: one digit means 1–9, two digits means 10–99, and so on. This also prevents zero divisors.

## Using the generator

From another file in `src/problem-engine`:

```ts
import { MainGameProblemGenerator } from "./MainGameProblemGenerator.ts";

const generator = new MainGameProblemGenerator();
const problem = generator.generate({
  operation: "addition",
  operandDigits: [2, 2],
});

console.log(problem.operands);             // The generated question's numbers
console.log(problem.solution.steps);       // The calculations used to solve it
console.log(problem.solution.finalAnswer); // The final answer
```

By default, the constructor uses `Math.random`. Tests can supply a function that returns known values to produce predictable operands.

## Example: 27 + 15

Suppose the generator chooses `27` and `15`.

1. Start with the first operand, `27`.
2. Calculate the addition columns from right to left.
3. Calculate `27 + 15 = 42` and save the step.
4. Return the operands, steps, and final answer.

The column calculations are:

| Column | Left digit | Right digit | Carry in | Total | Digit written | Carry out |
| --- | --- | --- | --- | --- | --- | --- |
| Ones | 7 | 5 | 0 | 12 | 2 | 1 |
| Tens | 2 | 1 | 1 | 4 | 4 | 0 |

The full returned object is:

```ts
{
  operands: [27, 15],
  answer: 42,
  solution: {
    steps: [
      {
        operation: "addition",
        leftOperand: 27,
        rightOperand: 15,
        result: 42,
        additionColumns: [
          {
            placeValue: 1,
            leftDigit: 7,
            rightDigit: 5,
            carryIn: 0,
            total: 12,
            resultDigit: 2,
            carryOut: 1,
          },
          {
            placeValue: 10,
            leftDigit: 2,
            rightDigit: 1,
            carryIn: 1,
            total: 4,
            resultDigit: 4,
            carryOut: 0,
          },
        ],
      },
    ],
    finalAnswer: 42,
  },
}
```

`answer` and `solution.finalAnswer` contain the same number. `answer` preserves the existing problem contract; `solution` groups the explanation with its final result.

## Understanding solution steps

Each `SolutionStep` records:

| Field | Meaning |
| --- | --- |
| `operation` | The arithmetic operation being performed |
| `leftOperand` | The running answer before this step |
| `rightOperand` | The next generated operand |
| `result` | The answer after this step |
| `additionColumns` | Column calculations for addition; `undefined` for other operations |

For multiple operands, calculations run from left to right. For `9 + 8 + 5`, the steps are `9 + 8 = 17`, followed by `17 + 5 = 22`. There is one step for each operand after the first.

`AdditionColumn` describes one column. Its `placeValue` is `1` for ones, `10` for tens, `100` for hundreds, and so on. `carryIn` comes from the previous column; `carryOut` goes to the next column. A final carry creates an extra leading column, as in `99 + 99 = 198`.

Subtraction, multiplication, and division currently record each operation's operands and result. Detailed borrowing, partial products, and long division are not implemented. Subtraction can produce negative answers, and division can produce fractional answers.

Calculations use JavaScript `number` arithmetic. The digit limit keeps individual generated operands within the safe integer range; accumulated results can exceed that range, and fractional division follows normal floating-point precision.

## Generator functions

- `constructor(random)`: saves the random number function used to choose operands.
- `generate(input)`: validates the parameters, generates operands, records the calculations, and returns the problem and solution.
- `getAdditionColumns(left, right)`: a private helper that records addition one column at a time, including carries.

## Tests


`MainGameProblemGenerator.test.ts` covers all four operations, digit ranges, input validation, multiple operands, solution results, and addition carries.
