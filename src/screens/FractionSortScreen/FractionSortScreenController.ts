import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { FractionSortScreenModel } from "./FractionSortScreenModel.ts";
import { FractionSortScreenView } from "./FractionSortScreenView.ts";

export class FractionSortScreenController extends ScreenController {
    private model: FractionSortScreenModel;
    private view: FractionSortScreenView;
    private screenSwitcher: ScreenSwitcher;

    constructor(screenSwitcher: ScreenSwitcher) {
        super();
        this.screenSwitcher = screenSwitcher;
        this.model = new FractionSortScreenModel();
        this.view = new FractionSortScreenView();
    }

    getView(): FractionSortScreenView { return this.view; }
}