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
    );
  }

  /** Opens the level clicked on the adventure map with a new problem for it. */
  setLevel(topic: LevelType, difficulty: number): void {
    this.model = new MainProblemScreenModel(topic, difficulty, this.dispatcher);
    this.view.setTitle(this.model.getTitle());
    this.view.setProblem(getProblemLayout(topic, this.model.getProblem()));
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
    if (!this.model.checkAnswer(this.view.getEnteredAnswer())) return;
    this.view.showCorrectAnswer();
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
