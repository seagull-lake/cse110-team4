# cse110-team4

## Digit-based problem generator

The shared component takes the number of digits for each operand and the operation.
It has no difficulty-level, game-state, view, controller, scoring, or storage dependency.

```ts
import { generateProblem, generateAnswer } from "./src/math/ProblemGenerator.ts";

const problem = generateProblem(2, 3, "addition");
// Example: { operation: "addition", operands: [23, 145], expression: "23 + 145", answer: 168 }

// Deterministic example for tests:
generateProblem(2, 3, "addition", () => 0);
// { operation: "addition", operands: [10, 100], expression: "10 + 100", answer: 110 }

const answer = generateAnswer(2, 3, "addition"); // Integer answer only
```

Every call generates a new problem. If a game displays the operands, call generateProblem
once and use its operands and answer together. Calling generateAnswer separately does not
retrieve the previous problem's answer.

### Input rules

- Operations: addition, subtraction, multiplication, division.
- Digit counts: integers from 1 to 15. Operands are positive integers with exact digit
  counts, no leading zeros; one digit means 1–9.
- Subtraction and division require leftDigits >= rightDigits. Subtraction swaps operands
  only when their digit counts are equal and the sampled left value is smaller.
- Division constructs an exact integer quotient, preserving both operand digit counts.
- Multiplication rejects digit combinations whose maximum product could exceed
  Number.MAX_SAFE_INTEGER. Generated answers are always safe, nonnegative integers.
- Invalid options and invalid random values throw RangeError. Sampling is bounded and
  does not use retry loops.
- An optional random function must return finite values in [0, 1).

Implementation: src/math/DigitProblemGenerator.ts. Shared sampling helpers, including
generateNumberWithDigits(digits), are in src/math/NumberGenerator.ts.

## Shared interfaces for minigame MVC

Interfaces live in a separate folder so minigame models, views, controllers, and generators
can import the same contracts without importing one another's implementation:

- src/interfaces/ProblemGeneration.ts: Operation, ProblemGenerationRequest, GeneratedProblem.
- src/interfaces/GameInterfaces.ts: request/result interfaces for the main game, the
  multiplication/division minigame, and the fraction minigame.
- src/math/types.ts: compatibility re-export for earlier imports.

## Simple dispatcher

dispatchProblem in src/math/GameInterpreter.ts routes each request and adapts the generated
numbers to the chosen game's result type. It does not select difficulty, manage rounds,
award points, persist state, or call a view/controller.

```ts
import { dispatchProblem, validateAnswer } from "./src/math/ProblemGenerator.ts";
import type { GameGenerationRequest } from "./src/interfaces/GameInterfaces.ts";

const request: GameGenerationRequest = {
  game: "multiplication-division",
  leftDigits: 2,
  rightDigits: 1,
  operation: "multiplication",
};
const question = dispatchProblem(request);
// Arithmetic operands + integer answer + four unique choices.
const feedback = validateAnswer(question, "42");
```

- main: fill-in-the-blank arithmetic, numeric answer, hint, and completed equation.
- multiplication-division: multiplication or division with four distinct choices and
  exactly one correct answer. Submit the choice's value, not its index.
- fraction: leftDigits specifies numerator digits, rightDigits specifies denominator
  digits. It generates a proper reference fraction and three comparison fractions
  (comparisonCount may be 1–10). Numerator digits must not exceed denominator digits.
  Submit relations as an array of lesser, greater, or equal to values.
  Comparisons use BigInt cross-products so large safe-integer fractions compare exactly.

FractionSort and all existing game MVC files remain unchanged. The fraction dispatcher
is independent and is not connected to the existing FractionSort implementation.

## Legacy level-based API

Earlier level-based helpers remain isolated for existing callers and regression tests:
generateLevelProblem(operation, level), generateBatch, generateGameProblem, getLevelConfig,
and LEVELS. New callers should use the digit-based generateProblem and dispatchProblem.
The old generateProblem(operation, level) call is now named generateLevelProblem.

The validator returns input validity, correctness, feedback, and solutions as data.
Game modules remain responsible for scoring and progress.

## Run and test

With Node.js 24.x and npm:

```sh
npm ci
npm run dev
npm test -- --run
```

Open http://localhost:5173/problem-generator.html, using the port printed by Vite if
different. The test page selects a game, operation, and two digit counts. It supports
sample previews and displays errors for incompatible digit combinations.

Run only the new component/dispatcher tests:

```sh
npm test -- --run src/math/DigitProblemGenerator.test.ts
```

Build and preview:

```sh
npx vite build
npm run preview
```

The original game has four existing TS6133 unused-variable errors in src/main.ts and
three screen controllers. They still block npm run build, which runs tsc first.
The targeted type checks of changed files and the Vite bundle can run independently.
