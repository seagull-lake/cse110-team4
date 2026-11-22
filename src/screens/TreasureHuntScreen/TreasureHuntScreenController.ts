import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { TreasureHuntScreenModel } from "./TreasureHuntScreenModel.ts";
import { TreasureHuntScreenView } from "./TreasureHuntScreenView.ts";

export class TreasureHuntScreenController extends ScreenController {
    private readonly model = new TreasureHuntScreenModel();
    private readonly view: TreasureHuntScreenView;

    constructor(screenSwitcher: ScreenSwitcher) {
        super();
        this.view = new TreasureHuntScreenView(
            () => screenSwitcher.switchToScreen({ type: "menu" }),
            topic => screenSwitcher.switchToScreen({ type: "adventuremap", topic }),
        );
    }

    /** Refresh on every visit, including after a topic has just been completed. */
    override show(): void {
        this.view.setTreasureData(this.model.getTreasureData());
        super.show();
    }

    getView(): TreasureHuntScreenView { return this.view; }
}
