import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { MultiplicationDivisionScreenModel } from "./MultiplicationDivisionScreenModel.ts";
import { MultiplicationDivisionScreenView } from "./MultiplicationDivisionScreenView.ts";

export class MultiplicationDivisionScreenController extends ScreenController {
    private model: MultiplicationDivisionScreenModel;
    private view: MultiplicationDivisionScreenView;
    private screenSwitcher: ScreenSwitcher;

    constructor(screenSwitcher: ScreenSwitcher) {
        super();
        this.screenSwitcher = screenSwitcher;
        this.model = new MultiplicationDivisionScreenModel();
        this.view = new MultiplicationDivisionScreenView();
    }

    getView(): MultiplicationDivisionScreenView { return this.view; }
}