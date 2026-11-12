import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import type { LevelType } from "../../levels/levelConfig.ts";
import { MainProblemScreenModel } from "./MainProblemScreenModel.ts";
import { MainProblemScreenView } from "./MainProblemScreenView.ts";

export class MainProblemScreenController extends ScreenController {
  private model: MainProblemScreenModel | null = null;
  private readonly view: MainProblemScreenView;
  private readonly screenSwitcher: ScreenSwitcher;

  constructor(screenSwitcher: ScreenSwitcher) {
    super();
    this.screenSwitcher = screenSwitcher;
    this.view = new MainProblemScreenView(() => this.handleHomeClick(), () => this.handleBackClick());
  }

  /** Opens the level clicked on the adventure map. */
  setLevel(topic: LevelType, difficulty: number): void {
    this.model = new MainProblemScreenModel(topic, difficulty);
    this.view.setTitle(this.model.getTitle());
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

  getView(): MainProblemScreenView { return this.view; }
}
