import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher, View } from "../../types.ts";
import type { LevelType } from "../../levels/levelConfig.ts";
import { TreasureRewardScreenModel } from "./TreasureRewardScreenModel.ts";
import type { TreasureRewardPage } from "./TreasureRewardScreenModel.ts";
import { TreasureRewardScreenView } from "./TreasureRewardScreenView.ts";

export interface TreasureRewardView extends View {
    render(page: TreasureRewardPage): void;
}

export class TreasureRewardScreenController extends ScreenController {
    private model: TreasureRewardScreenModel | null = null;
    private readonly view: TreasureRewardView;
    private readonly screenSwitcher: ScreenSwitcher;
    constructor(screenSwitcher: ScreenSwitcher,
        createView: (onContinue: () => void, onHome: () => void) => TreasureRewardView =
            (onContinue, onHome) => new TreasureRewardScreenView(onContinue, onHome),
    ) {
        super();
        this.screenSwitcher = screenSwitcher;
        this.view = createView(
            () => this.handleContinue(),
            () => this.handleHome(),
        );
    }
    setReward(topic: LevelType, difficulty: number, allTopicsCompleted = false): void {
        this.model = new TreasureRewardScreenModel(topic, difficulty, allTopicsCompleted);
        this.updateView();
    }
    private handleContinue(): void {
        if (!this.model) return;
        const page = this.model.getCurrentPage();
        if (page.hasNext) {
            this.model.nextPage();
            this.updateView();
            return;
        }
        this.model = null;
        if (page.type === "ultimate") {
            this.screenSwitcher.switchToScreen({ type: "maingame" });
        } else {
            this.screenSwitcher.switchToScreen({ type: "adventuremap", topic: page.topic });
        }
    }
    private handleHome(): void {
        this.model = null;
        this.screenSwitcher.switchToScreen({ type: "menu" });
    }
    private updateView(): void {
        if (this.model) this.view.render(this.model.getCurrentPage());
    }
    getView(): TreasureRewardView { return this.view; }
}
