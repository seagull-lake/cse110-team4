import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import type { LevelType } from "../../levels/levelConfig.ts";
import { MainGameScreenModel } from "./MainGameScreenModel.ts";
import { MainGameScreenView } from "./MainGameScreenView.ts";

export class MainGameScreenController extends ScreenController {
    private model: MainGameScreenModel;
    private view: MainGameScreenView;
    private screenSwitcher: ScreenSwitcher;

    constructor(screenSwitcher: ScreenSwitcher) {
        super();
        this.screenSwitcher = screenSwitcher;
        this.model = new MainGameScreenModel();
        this.view = new MainGameScreenView(this.model.getTopics(),
                                           (topic) => this.handleTopicClick(topic),
                                           () => this.handleHomeClick());
    }

    private handleTopicClick(topic: LevelType): void {
        this.model.selectTopic(topic);
        this.screenSwitcher.switchToScreen({ type: "adventuremap", topic });
    }

    private handleHomeClick(): void {
        // stop any timers / save progress here before leaving
        this.screenSwitcher.switchToScreen({ type: "menu" });
    }

    getView(): MainGameScreenView { return this.view; }
}
