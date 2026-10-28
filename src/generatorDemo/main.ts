import { dispatchProblem, MAX_OPERAND_DIGITS, validateAnswer } from "../math/ProblemGenerator.ts";
import type { Operation, GameGenerationRequest, DispatchedProblem } from "../interfaces/GameInterfaces.ts";
import "./style.css";

function element<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error("Missing element: " + id);
  return node as T;
}
const game = element<HTMLSelectElement>("game");
const operation = element<HTMLSelectElement>("operation");
const leftDigits = element<HTMLSelectElement>("left-digits");
const rightDigits = element<HTMLSelectElement>("right-digits");
const answer = element<HTMLInputElement>("answer");
const check = element<HTMLButtonElement>("check");
const next = element<HTMLButtonElement>("next");
const restart = element<HTMLButtonElement>("restart");
const feedback = element("feedback");
const reveal = element<HTMLInputElement>("reveal");
const choices = element("choices");
const fractionAnswers = element<HTMLFieldSetElement>("fraction-answers");
let problems: DispatchedProblem[] = [];
let samples: DispatchedProblem[] = [];
let index = 0;
let correct = 0;
let attempted = false;
let solved = false;

for (let digits = 1; digits <= MAX_OPERAND_DIGITS; digits++) {
  const text = digits + (digits === 1 ? " digit" : " digits");
  leftDigits.add(new Option(text, String(digits)));
  rightDigits.add(new Option(text, String(digits)));
}
leftDigits.value = "2";
rightDigits.value = "2";
function request(): GameGenerationRequest {
  const digits = { leftDigits: Number(leftDigits.value), rightDigits: Number(rightDigits.value) };
  if (game.value === "fraction") return { game: "fraction", ...digits };
  if (game.value === "multiplication-division") {
    return { game: "multiplication-division", ...digits, operation: operation.value as "multiplication" | "division" };
  }
  return { game: "main", ...digits, operation: operation.value as Operation };
}
function updateOperations(): void {
  const previous = operation.value;
  operation.replaceChildren();
  if (game.value === "fraction") {
    operation.add(new Option("Fraction comparison", "fraction"));
    operation.disabled = true;
    return;
  }
  const operations = game.value === "multiplication-division"
    ? ["multiplication", "division"] : ["addition", "subtraction", "multiplication", "division"];
  for (const op of operations) operation.add(new Option(op[0].toUpperCase() + op.slice(1), op));
  operation.value = operations.includes(previous) ? previous : operations[0];
  operation.disabled = false;
}
function batch(count: number): DispatchedProblem[] {
  const result: DispatchedProblem[] = [];
  for (let i = 0; i < count; i++) result.push(dispatchProblem(request()));
  return result;
}
function updateScore(): void {
  element("score").textContent = correct + " of " + (index + (solved ? 1 : 0)) + " correct on the first try";
}
function showProblem(): void {
  const problem = problems[index];
  attempted = false;
  solved = false;
  answer.value = "";
  answer.disabled = false;
  answer.hidden = problem.game !== "main";
  answer.required = problem.game === "main";
  element("answer-label").hidden = problem.game !== "main";
  check.hidden = problem.game === "multiplication-division";
  check.disabled = false;
  next.hidden = true;
  restart.hidden = true;
  feedback.textContent = "";
  feedback.className = "";
  element("expression").textContent = problem.prompt;
  element("round-label").textContent = "Question " + (index + 1) + " of 5";
  element<HTMLProgressElement>("progress").value = index;
  element("hint").hidden = problem.game !== "main";
  element("hint-text").hidden = true;
  element("hint-text").textContent = "";
  choices.replaceChildren();
  choices.hidden = problem.game !== "multiplication-division";
  fractionAnswers.replaceChildren();
  fractionAnswers.disabled = false;
  fractionAnswers.hidden = problem.game !== "fraction";
  if (problem.game === "multiplication-division") {
    for (const value of problem.choices) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = String(value);
      button.addEventListener("click", () => submitAnswer(value));
      choices.append(button);
    }
  } else if (problem.game === "fraction") {
    const legend = document.createElement("legend");
    legend.textContent = "Compare each fraction with " + problem.reference.numerator + "/" + problem.reference.denominator;
    fractionAnswers.append(legend);
    for (const [i, fraction] of problem.comparisons.entries()) {
      const label = document.createElement("label");
      label.textContent = fraction.numerator + "/" + fraction.denominator + " is";
      const select = document.createElement("select");
      select.id = "comparison-" + i;
      select.className = "fraction-relation";
      select.required = true;
      select.add(new Option("Choose a relation", ""));
      for (const relation of ["lesser", "greater", "equal to"]) select.add(new Option(relation, relation));
      label.append(select);
      fractionAnswers.append(label);
    }
  }
  updateScore();
}
function renderSamples(): void {
  const body = element("samples");
  body.replaceChildren();
  samples.forEach((problem, i) => {
    const row = document.createElement("tr");
    const question = problem.game === "fraction"
      ? problem.expression + ": " + problem.comparisons.map(f => f.numerator + "/" + f.denominator).join(", ")
      : problem.prompt + (problem.game === "multiplication-division" ? " [" + problem.choices.join(", ") + "]" : "");
    const solution = Array.isArray(problem.solution) ? problem.solution.join(", ") : String(problem.solution);
    for (const value of [String(i + 1), question, reveal.checked ? solution : "Hidden"]) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    }
    body.append(row);
  });
}
function generateSamples(): void {
  try { samples = batch(10); }
  catch (error) {
    samples = [];
    feedback.textContent = error instanceof Error ? error.message : "Invalid generation settings.";
  }
  renderSamples();
}
function reset(): void {
  index = 0;
  correct = 0;
  const range = (digits: number) => (10 ** (digits - 1)).toLocaleString("en-US") + "–" + (10 ** digits - 1).toLocaleString("en-US");
  element("rules").textContent = game.value === "fraction"
    ? "Numerator: " + range(Number(leftDigits.value)) + ". Denominator: " + range(Number(rightDigits.value)) + ". Proper fractions only."
    : "First operand: " + range(Number(leftDigits.value)) + ". Second operand: " + range(Number(rightDigits.value)) + ". Integer answers only.";
  try {
    problems = batch(5);
  } catch (error) {
    problems = [];
    solved = false;
    element<HTMLFormElement>("answer-form").hidden = true;
    element("hint").hidden = true;
    element("hint-text").hidden = true;
    next.hidden = true;
    restart.hidden = true;
    element("expression").textContent = "Choose compatible digit counts.";
    element("round-label").textContent = "";
    element<HTMLProgressElement>("progress").value = 0;
    feedback.className = "retry";
    feedback.textContent = error instanceof Error ? error.message : "Invalid generation settings.";
    updateScore();
    return;
  }
  element<HTMLFormElement>("answer-form").hidden = false;
  showProblem();
}
function submitAnswer(input: unknown): void {
  if (solved) return;
  const result = validateAnswer(problems[index], input);
  feedback.textContent = result.feedback;
  feedback.className = result.correct ? "success" : "retry";
  if (!result.valid) return;
  if (!result.correct) { attempted = true; return; }
  if (!attempted) correct++;
  solved = true;
  answer.disabled = true;
  check.disabled = true;
  fractionAnswers.disabled = true;
  choices.querySelectorAll("button").forEach(button => { button.disabled = true; });
  element<HTMLProgressElement>("progress").value = index + 1;
  updateScore();
  if (index === problems.length - 1) {
    element("round-label").textContent = "Round complete!";
    feedback.textContent = "Round complete! " + correct + " of 5 correct on your first try.";
    restart.hidden = false;
    restart.focus();
  } else {
    next.hidden = false;
    next.focus();
  }
}
element<HTMLFormElement>("answer-form").addEventListener("submit", event => {
  event.preventDefault();
  if (!problems[index]) return;
  const input = problems[index].game === "fraction"
    ? Array.from(fractionAnswers.querySelectorAll<HTMLSelectElement>("select"), select => select.value)
    : answer.value;
  submitAnswer(input);
});
element("hint").addEventListener("click", () => {
  const problem = problems[index];
  if (problem?.game === "main") {
    element("hint-text").textContent = problem.hint;
    element("hint-text").hidden = false;
  }
});
next.addEventListener("click", () => {
  if (!solved || index >= problems.length - 1) return;
  index++;
  showProblem();
  if (problems[index].game === "main") answer.focus();
});
restart.addEventListener("click", reset);
game.addEventListener("change", () => { updateOperations(); reset(); generateSamples(); });
for (const control of [operation, leftDigits, rightDigits]) control.addEventListener("change", () => { reset(); generateSamples(); });
element("batch").addEventListener("click", generateSamples);
reveal.addEventListener("change", renderSamples);
updateOperations();
reset();
generateSamples();
