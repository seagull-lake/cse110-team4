import { checkAnswer, getLevelConfig, LEVELS, ProblemGenerator } from "../math/ProblemGenerator.ts";
import type { DifficultyLevel, Operation, Problem } from "../math/ProblemGenerator.ts";
import "./style.css";

function element<T extends HTMLElement>(id: string): T {
  const result = document.getElementById(id);
  if (!result) throw new Error(`Missing element: ${id}`);
  return result as T;
}
const generator = new ProblemGenerator();
const operation = element<HTMLSelectElement>("operation");
const level = element<HTMLSelectElement>("level");
const answer = element<HTMLInputElement>("answer");
const check = element<HTMLButtonElement>("check");
const next = element<HTMLButtonElement>("next");
const restart = element<HTMLButtonElement>("restart");
const feedback = element<HTMLParagraphElement>("feedback");
const reveal = element<HTMLInputElement>("reveal");
let problems: Problem[] = [];
let samples: Problem[] = [];
let index = 0;
let correct = 0;
let attempted = false;
let solved = false;

for (const config of LEVELS) level.add(new Option(`Level ${config.level} · ${config.name}`, String(config.level)));
function selected(): [Operation, DifficultyLevel] {
  return [operation.value as Operation, Number(level.value) as DifficultyLevel];
}
function updateScore(): void {
  element("score").textContent = `${correct} of ${index + (solved ? 1 : 0)} correct on the first try`;
}
function showProblem(): void {
  attempted = false;
  solved = false;
  answer.value = "";
  answer.disabled = false;
  check.disabled = false;
  next.hidden = true;
  restart.hidden = true;
  feedback.textContent = "";
  feedback.className = "";
  element("expression").textContent = `${problems[index].expression} = ?`;
  element("round-label").textContent = `Question ${index + 1} of 5`;
  element<HTMLProgressElement>("progress").value = index;
  updateScore();
}
function renderSamples(): void {
  const body = element("samples");
  body.replaceChildren();
  samples.forEach((problem, i) => {
    const row = document.createElement("tr");
    [String(i + 1).padStart(2, "0"), `${problem.expression} = ?`, reveal.checked ? String(problem.answer) : "Hidden"].forEach(value => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    });
    body.append(row);
  });
}
function generateSamples(): void {
  samples = generator.generateBatch(...selected(), 10);
  renderSamples();
}
function reset(): void {
  index = 0;
  correct = 0;
  problems = generator.generateBatch(...selected(), 5);
  const [op, selectedLevel] = selected();
  const config = getLevelConfig(selectedLevel);
  const range = ([min, max]: readonly [number, number]) => `${min.toLocaleString("en-US")}–${max.toLocaleString("en-US")}`;
  element("rules").textContent = op === "multiplication"
    ? `Factors: ${range(config.multiplication[0])} × ${range(config.multiplication[1])}.`
    : op === "division"
      ? `Dividend: ${range(config.division.dividend)}. Divisor: ${range(config.division.divisor)}. No remainders.`
      : `Operands: ${range(config.additionSubtraction)}.${op === "subtraction" ? " Answers stay at or above zero." : ""}`;
  showProblem();
}
element<HTMLFormElement>("answer-form").addEventListener("submit", event => {
  event.preventDefault();
  if (solved) return;
  if (!/^\d+$/.test(answer.value.trim())) {
    feedback.textContent = "Enter a whole number, such as 24.";
    feedback.className = "retry";
    return;
  }
  if (!checkAnswer(problems[index], answer.value)) {
    attempted = true;
    feedback.textContent = "Keep going! Try that problem again.";
    feedback.className = "retry";
    answer.select();
    return;
  }
  if (!attempted) correct++;
  solved = true;
  answer.disabled = true;
  check.disabled = true;
  feedback.textContent = "You got it! Nice work.";
  feedback.className = "success";
  element<HTMLProgressElement>("progress").value = index + 1;
  updateScore();
  if (index === problems.length - 1) {
    element("round-label").textContent = "Round complete!";
    feedback.textContent = `Round complete! ${correct} of 5 correct on your first try. Try another round or choose a new level.`;
    restart.hidden = false;
    restart.focus();
  } else {
    next.hidden = false;
    next.focus();
  }
});
next.addEventListener("click", () => { if (!solved || index >= 4) return; index++; showProblem(); answer.focus(); });
restart.addEventListener("click", () => { reset(); answer.focus(); });
[operation, level].forEach(control => control.addEventListener("change", () => { reset(); generateSamples(); }));
element("batch").addEventListener("click", generateSamples);
reveal.addEventListener("change", renderSamples);
reset();
generateSamples();
