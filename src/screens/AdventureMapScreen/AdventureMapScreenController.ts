import { ScreenController } from "../../types.ts";
import type { AdventureMapScreenView } from "./AdventureMapScreenView.ts";

export class AdventureMapScreenController extends ScreenController {
  private readonly view: AdventureMapScreenView;

  constructor(view: AdventureMapScreenView) {
    super();
    this.view = view;
  }

  getView(): AdventureMapScreenView { return this.view; }
}
