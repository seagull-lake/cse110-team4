import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import type { LevelType } from "../../levels/levelConfig.ts";
import type { ProblemDispatcher } from "../../problem-engine/ProblemDispatcher.ts";
import { getLevelDefinition } from "../../levels/levelConfig.ts";
import { completeLevel, startLevel } from "../../levels/progression.ts";
import { loadProgression, saveProgression } from "../../storage.ts";
import { MainProblemScreenModel, createProblemDispatcher } from "./MainProblemScreenModel.ts";
import { getProblemLayout } from "./MainProblemLayout.ts";
import { MainProblemScreenView } from "./MainProblemScreenView.ts";
import { SolutionScreenController } from "../SolutionScreen/SolutionScreenController.ts";
import type { SolvedMainGameProblem } from "../../problem-engine/MainGameProblemGenerator.ts";

export class MainProblemScreenController extends ScreenController {
  private model: MainProblemScreenModel | null = null;
  private readonly view: MainProblemScreenView;
  private readonly screenSwitcher: ScreenSwitcher;
  private readonly dispatcher: ProblemDispatcher;
  private solutionOpen = false;// Whether the solution view is currently open, which disables typing and field selection.

  constructor(screenSwitcher: ScreenSwitcher, dispatcher: ProblemDispatcher = createProblemDispatcher()) {
    super();
    this.screenSwitcher = screenSwitcher;
    this.dispatcher = dispatcher;
    this.view = new MainProblemScreenView(
      () => this.handleHomeClick(),
      () => this.handleBackClick(),
      () => this.handleSubmitClick(),
      () => this.handleContinueClick(),
      key => this.handleKey(key),
      index => this.handleFieldClick(index),
    );
  }

  /** Opens the level clicked on the adventure map with a new problem for it. */
  setLevel(topic: LevelType, difficulty: number): void {
    this.solutionOpen = false;
    this.model = new MainProblemScreenModel(topic, difficulty, this.dispatcher);
    this.view.setTitle(this.model.getTitle());
    this.view.setProblem(getProblemLayout(topic, this.model.getProblem()));
    this.showAnswer();
  }

  /**
   * Typing fills in the active field from right to left: digits (and a "-" in the leftmost box of the
   * answer). Backspace removes the one typed last, Escape empties the field, Tab / Shift+Tab move to
   * the next / previous field.
   */
  private handleKey(key: string): void {
    if (!this.model || this.solutionOpen) return;// Ignore typing when the solution view is open.
    if (key === "Backspace") this.model.deleteLastCharacter();
    else if (key === "Escape") this.model.clearActiveField();
    else if (key === "Tab") this.model.nextField();
    else if (key === "Shift+Tab") this.model.previousField();
    else if (!this.model.typeCharacter(key)) return;
    this.showAnswer();
  }

  /** Clicking a field's box moves typing there. */
  private handleFieldClick(index: number): void {
    if (!this.model || this.solutionOpen) return;
    this.model.selectField(index);
    this.showAnswer();
  }

  private showAnswer(): void {
    if (this.model) this.view.showAnswer(this.model.getEntries(), this.model.getActiveField());
  }

  private handleHomeClick(): void {
    this.screenSwitcher.switchToScreen({ type: "menu" });
  }

  /** Back to the map of the topic this level belongs to. */
  private handleBackClick(): void {
    if (!this.model) {
      this.screenSwitcher.switchToScreen({ type: "maingame" });
      return;
    }
    this.screenSwitcher.switchToScreen({ type: "adventuremap", topic: this.model.getTopic() });
  }

  /** Keep correct-answer feedback, or show the original division solution after a wrong answer. */
  private handleSubmitClick(): void {
    if (!this.model || this.solutionOpen) return;
    const digits = this.view.getEnteredAnswer();
    if (!digits.some(digit => /^[0-9]$/.test(digit))) return;
    if (this.model.checkAnswer(digits)) {
      this.view.showCorrectAnswer();
      return;
    }
    if (this.model.getTopic() !== "division") return;

    const solution = new SolutionScreenController(
      this.model.getProblem() as SolvedMainGameProblem,
      () => this.handleSimilarQuestion(),
    );
    this.solutionOpen = true;
    this.view.showSolution(solution.getView());
  }

  /** Reopen the same level so its usual dispatcher creates a new question. */
  private handleSimilarQuestion(): void {
    if (!this.model || !this.solutionOpen) return;
    this.screenSwitcher.switchToScreen({
      type: "mainproblem",
      topic: this.model.getTopic(),
      difficulty: this.model.getDifficulty(),
    });
  }

  private handleContinueClick(): void {
    if (!this.model?.canContinue() || this.solutionOpen) return;

    const level = getLevelDefinition(this.model.getTopic());
    const progression = loadProgression(level);
    if (!progression.isCompleted && progression.currentDifficulty === this.model.getDifficulty()) {
      const activeProgression = startLevel(level, progression, level.id);
      saveProgression(level, completeLevel(level, activeProgression, level.id));
    }

    this.screenSwitcher.switchToScreen({ type: "adventuremap", topic: this.model.getTopic() });
  }

  getView(): MainProblemScreenView { return this.view; }
}
