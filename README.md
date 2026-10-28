# cse110-team4
CSE 110 Project - Team 4

## Problem generator

A standalone TypeScript generator for whole-number practice for US grades 3–4. It has no DOM, storage, or game dependencies. Existing game screens are unchanged.

Run `npm install`, then `npm run dev` and open **http://localhost:5173/problem-generator.html**. The test page lets you select any operation and level, complete a five-question practice round, track first-try accuracy, and inspect ten generated samples with an optional answer key. Changing settings starts a fresh round. Progress is for the current round only; levels are freely selectable.

Run `npm test -- --run` for automated tests and `npm run build` for type checking and a production build. Both the original game and `problem-generator.html` are included in the build. `npm run preview` serves the built pages.

### Difficulty rules

All endpoints are inclusive. These are practice bands, not a formal curriculum or mastery assessment. Levels 1–2 review facts, level 3 bridges toward multi-digit work, and levels 4–5 extend grade-four practice. Addition and subtraction allow carrying and borrowing.

| Level | Addition/subtraction operands | Multiplication factors | Division dividend / divisor |
| --- | --- | --- | --- |
| 1 | 0–10 | 0–5 × 0–5 | 0–25 / 1–5 |
| 2 | 10–99 | 0–10 × 0–10 | 0–100 / 2–10 |
| 3 | 100–999 | 10–99 × 2–9 | 10–99 / 2–9 |
| 4 | 1,000–9,999 | 100–999 × 2–9 | 100–999 / 2–9 |
| 5 | 10,000–99,999 | 10–99 × 10–99 | 1,000–9,999 / 2–9 |

Subtraction sorts operands so answers are nonnegative. Division chooses a nonzero divisor and a whole-number quotient within the dividend bounds, then multiplies them to construct the dividend. There are no remainders or unbounded retry loops. Random selection is uniform over each sampled range, not over all possible division equations. Independent samples can repeat, and a higher level describes the practice range rather than guaranteeing every question is harder than the previous one.

### API

```ts
import { ProblemGenerator, checkAnswer } from "./src/math/ProblemGenerator.ts";

const generator = new ProblemGenerator();
const problem = generator.generate("multiplication", 3);
// { operation, level, operands: [left, right], expression: "… × …", answer }
const correct = checkAnswer(problem, "42");
const round = generator.generateBatch("division", 4, 10);
```

Operations: `addition`, `subtraction`, `multiplication`, `division`. Levels: integers 1–5. Batch sizes: integers 1–100. Invalid options throw `RangeError`. `checkAnswer` accepts a whole-number string (surrounding whitespace allowed) or safe integer and rejects blanks, partial numbers, decimal strings, and non-finite values. Problems and shared level configurations are immutable.

Pass a random function to `new ProblemGenerator(random)` for deterministic sequences. It must return finite numbers in `[0, 1)`. Tests cover all 20 operation/level combinations with 10,000 seeded samples, random endpoints, arithmetic invariants, difficulty boundaries, zero facts, invalid inputs, batches, reproducibility, and answer checking.
