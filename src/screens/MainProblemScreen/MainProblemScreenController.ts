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
      () => this.handleTryAgainClick(),
      () => this.handleReviewMistakesClick(),
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
    if (!this.model) return;
    this.view.showAnswer(this.model.getEntries(), this.model.getActiveField());
    this.view.setSubmitEnabled(this.model.isComplete());
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

  /**
   * Only checks the solution once every box (the in-between steps and the answer) is filled in;
   * otherwise the student is told to finish first. When the steps and answer are all right, save
   * completion and offer Continue. Otherwise the Incorrect state marks the wrong boxes and offers
   * Try Again or Review Mistakes (the solution screen).
   */
  private handleSubmitClick(): void {
    if (!this.model || this.model.canTryAgain()) return;
    if (!this.model.isComplete()) {
      this.view.showIncompleteMessage();
      return;
    }
    if (this.model.checkSolution()) {
      // Save before Try Again can replace this problem or the player can leave the screen.
      const level = getLevelDefinition(this.model.getTopic());
      const progression = loadProgression(level);
      if (!progression.isCompleted && progression.currentDifficulty === this.model.getDifficulty()) {
        const activeProgression = startLevel(level, progression, level.id);
        saveProgression(level, completeLevel(level, activeProgression, level.id));
      }
      this.view.showCorrectAnswer();
    } else {
      this.view.showIncorrectAnswer(this.model.getWrongFields());
    }
  }

  /** From the Incorrect state: walk through the solution of this same problem. */
  private handleReviewMistakesClick(): void {
    if (!this.model?.canReviewMistakes()) return;
    this.screenSwitcher.switchToScreen({
      type: "solution",
      problem: this.model.getProblem(),
      topic: this.model.getTopic(),
      difficulty: this.model.getDifficulty(),
    });
  }

  /** After a correct or incorrect answer: a new problem of the same level, with every box empty. */
  private handleTryAgainClick(): void {
    if (!this.model?.canTryAgain()) return;
    this.setLevel(this.model.getTopic(), this.model.getDifficulty());
  }

  private handleContinueClick(): void {
    if (!this.model?.canContinue()) return;
    this.screenSwitcher.switchToScreen({ type: "adventuremap", topic: this.model.getTopic() });
  }

  getView(): MainProblemScreenView { return this.view; }
}
