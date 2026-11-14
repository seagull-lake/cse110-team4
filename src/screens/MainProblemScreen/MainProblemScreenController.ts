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

export class MainProblemScreenController extends ScreenController {
  private model: MainProblemScreenModel | null = null;
  private readonly view: MainProblemScreenView;
  private readonly screenSwitcher: ScreenSwitcher;
  private readonly dispatcher: ProblemDispatcher;

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
    if (!this.model) return;
    if (key === "Backspace") this.model.deleteLastCharacter();
    else if (key === "Escape") this.model.clearActiveField();
    else if (key === "Tab") this.model.nextField();
    else if (key === "Shift+Tab") this.model.previousField();
    else if (!this.model.typeCharacter(key)) return;
    this.showAnswer();
  }

  /** Clicking a field's box moves typing there. */
  private handleFieldClick(index: number): void {
    if (!this.model) return;
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

  private handleSubmitClick(): void {
    if (!this.model) return;
    const answer = this.view.getEnteredAnswer();
    if (answer.length !== this.model.getAnswerLength() || answer.some(digit => digit === "")) return;
    if (this.model.checkAnswer(answer)) {
      this.view.showCorrectAnswer();
    } else {
      this.screenSwitcher.switchToScreen({
        type: "solution",
        problem: this.model.getProblem(),
        topic: this.model.getTopic(),
        difficulty: this.model.getDifficulty(),
      });
    }
  }

  private handleContinueClick(): void {
    if (!this.model?.canContinue()) return;

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
