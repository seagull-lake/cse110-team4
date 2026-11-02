import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { getLevelDefinition } from "../../levels/levelConfig.ts";
import type { LevelType } from "../../levels/levelConfig.ts";
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
    this.view = new AdventureMapScreenView(() => this.handleHomeClick());
  }

  /** Shows the map for the topic chosen on the topic screen. */
  setTopic(topic: LevelType): void {
    this.model = new AdventureMapScreenModel(getLevelDefinition(topic));
    this.view.setTopic(topic);
  }

  getTopic(): LevelType { return this.model.getMapData().level.type; }

  private handleHomeClick(): void {
    this.screenSwitcher.switchToScreen({ type: "menu" });
  }

  getView(): AdventureMapScreenView { return this.view; }
}
