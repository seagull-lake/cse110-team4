import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { MenuScreenView } from "./MenuScreenView.ts";

export class MenuScreenController extends ScreenController {
    private view: MenuScreenView;
    private screenSwitcher: ScreenSwitcher;

    constructor(screenSwitcher: ScreenSwitcher) {
        super();
        this.screenSwitcher = screenSwitcher;
        this.view = new MenuScreenView(() => this.handleMainGameClick(),
                                       () => this.handleMultiDivGameClick(),
                                       () => this.handleFractionGameClick(),
                                       () => this.screenSwitcher.switchToScreen({ type: "treasurehunt" }));
    }

    private handleMainGameClick(): void {
        this.screenSwitcher.switchToScreen({ type: "maingame" })

    }

    private handleMultiDivGameClick(): void {
        this.screenSwitcher.switchToScreen({ type: "multidivgame" })

    }

    private handleFractionGameClick(): void {
        this.screenSwitcher.switchToScreen({ type: "fractiongame" })

    }

    getView(): MenuScreenView { 
        return this.view; 
    }
}
