import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { getLevelDefinition } from "../../levels/levelConfig.ts";
import type { LevelType } from "../../levels/levelConfig.ts";
import { isLevelUnlocked } from "../../levels/progression.ts";
import { loadProgression } from "../../storage.ts";
import { AdventureMapScreenModel } from "./AdventureMapScreenModel.ts";
import { AdventureMapScreenView } from "./AdventureMapScreenView.ts";

export class AdventureMapScreenController extends ScreenController {
  private model: AdventureMapScreenModel;
  private readonly view: AdventureMapScreenView;
  private readonly screenSwitcher: ScreenSwitcher;

  constructor(screenSwitcher: ScreenSwitcher) {
    super();
    this.screenSwitcher = screenSwitcher;
    this.model = new AdventureMapScreenModel();
    this.view = new AdventureMapScreenView(
      () => this.handleHomeClick(),
      difficulty => this.handleLevelClick(difficulty),
      () => this.handleStartClick(),
      () => this.handleBackClick(),
    );
  }

  /** Shows the map for the topic chosen on the topic screen, using that topic's saved progress. */
  setTopic(topic: LevelType): void {
    const level = getLevelDefinition(topic);
    this.model = new AdventureMapScreenModel(level, loadProgression(level));
    this.view.setTopic(topic, this.model.getMapData());
  }

  getTopic(): LevelType { return this.model.getMapData().level.type; }

  /** Opens a completed or current level; locked levels do nothing. */
  private handleLevelClick(difficulty: number): void {
    const { level, progression } = this.model.getMapData();
    if (!isLevelUnlocked(level, progression, difficulty)) return;
    this.screenSwitcher.switchToScreen({ type: "mainproblem", topic: level.type, difficulty });
  }

  /** "Start level N" opens the current level. */
  private handleStartClick(): void {
    this.handleLevelClick(this.model.getMapData().progression.currentDifficulty);
  }

  private handleHomeClick(): void {
    this.screenSwitcher.switchToScreen({ type: "menu" });
  }

  /** Back to the topic selection screen. */
  private handleBackClick(): void {
    this.screenSwitcher.switchToScreen({ type: "maingame" });
  }

  getView(): AdventureMapScreenView { return this.view; }
}
