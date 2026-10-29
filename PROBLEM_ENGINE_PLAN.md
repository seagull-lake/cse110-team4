# Problem engine contract plan

## Goal and scope

This PR defines the TypeScript contracts for an arithmetic problem engine. It does not generate problems, render a screen, grade a player's answer, or change navigation. The contracts must be usable by both game models without importing Konva or a concrete generator.

## Inputs and routing

The engine accepts one request with:

| Field | Type | Meaning |
| --- | --- | --- |
| `operand1Digits` | `number` | Decimal digit count for the first operand. |
| `operand2Digits` | `number` | Decimal digit count for the second operand. |
| `operation` | `OperationType` | Addition, subtraction, multiplication, or division. |
| `gameType` | `GameType` | `main-game` or `mini-game-1`. |

The interpreter selects exactly one generator from `gameType`. Both generators receive the digit counts and operation. The game type is a routing field, not a mathematical rule. It is deliberately distinct from the existing `Screen` identifiers because the engine should not depend on navigation.

## Shared results

- `MainGameProblem`: `operand1`, `operand2`, and a numeric `answer`.
- `MiniGameOneProblem`: `operand1`, `operand2`, and exactly four numeric answer options. Each option has an `isCorrect` flag. The generator must provide exactly one correct option and three incorrect options; the four values should be distinct.
- The result types belong in `src/domain/problem.ts`, outside `src/problem-engine/` and outside individual screen models. Both models may import them without depending on an implementation.
- The engine request type is a discriminated union. A `main-game` request maps to `MainGameProblem`; a `mini-game-1` request maps to `MiniGameOneProblem`.

## Component design

**Recommended:** three small components with separate contracts: `ProblemEngine` routes requests, `MainGameProblemGenerator` creates fill-in problems, and `MiniGameOneProblemGenerator` creates multiple-choice problems. The two generators may share private arithmetic helpers later. This keeps game-specific choice generation out of the main-game generator and makes routing testable without random numbers.

A single class would be shorter initially, but it would combine dispatch, arithmetic generation, and multiple-choice construction. Three components are a better fit if the games evolve independently. For this PR, only the interfaces and method signatures are added; no concrete classes or placeholder results are needed.

```ts
interface ProblemEngine {
  generate(request: MainGameProblemRequest): MainGameProblem;
  generate(request: MiniGameOneProblemRequest): MiniGameOneProblem;
}

interface MainGameProblemGenerator {
  generate(input: ProblemParameters): MainGameProblem;
}

interface MiniGameOneProblemGenerator {
  generate(input: ProblemParameters): MiniGameOneProblem;
}
```

## Rules for the implementation PR

- Reject digit counts that are not positive integers, unsupported game types, and unsupported operations before routing.
- Respect the requested decimal width for both operands. Define whether zero may be a one-digit operand before implementing the random selection.
- Never produce division by zero. Decide whether division results must be whole numbers before implementing division.
- Define whether subtraction may produce negative answers.
- For mini-game 1, return four distinct answer values with exactly one correct flag. Decide whether the correct option is always first or whether the order varies.
- Keep random number generation injectable or isolated so arithmetic and routing tests can be deterministic.
- Do not expose the correct answer to a View that should only show choices; the game Model can hold the full result and pass a presentation-only subset to the View.

## Acceptance for this PR

1. Shared types compile without a browser, screen, or concrete generator.
2. The engine and both generators have typed inputs and outputs.
3. The two result shapes match the required games, including four mini-game choices.
4. No random generation, fake output, screen wiring, or grading is introduced.
