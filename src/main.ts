import Konva from "konva";
import type { ScreenSwitcher, Screen } from "./types.ts";
import { STAGE_WIDTH, STAGE_HEIGHT } from "./constants.ts";
import { MenuScreenController } from "./screens/MenuScreen/MenuScreenController.ts";
import { FractionSortScreenController } from "./screens/FractionSortScreen/FractionSortScreenController.ts";
import { MainGameScreenController } from "./screens/MainGameScreen/MainGameScreenController.ts";
import { MultiplicationDivisionScreenController } from "./screens/MultiplicationDivisionScreen/MultiplicationDivisionScreenController.ts";

const SCREEN_KEY = "currentScreen";

class App implements ScreenSwitcher {
  private stage: Konva.Stage;
  private layer: Konva.Layer;
  private menuController: MenuScreenController;
  private fractiongameController: FractionSortScreenController;
  private maingameController: MainGameScreenController;
  private multidivController: MultiplicationDivisionScreenController;

  constructor(container: string) {
    this.stage = new Konva.Stage({ container, width: STAGE_WIDTH, height: STAGE_HEIGHT });
    this.layer = new Konva.Layer();
    this.stage.add(this.layer);

    this.menuController = new MenuScreenController(this);
    this.fractiongameController = new FractionSortScreenController(this);
    this.maingameController = new MainGameScreenController(this);
    this.multidivController = new MultiplicationDivisionScreenController(this);

    this.layer.add(this.menuController.getView().getGroup());
    this.layer.add(this.fractiongameController.getView().getGroup());
    this.layer.add(this.maingameController.getView().getGroup());
    this.layer.add(this.multidivController.getView().getGroup());


    this.layer.draw();
    this.menuController.show();
    this.switchToScreen(this.loadSavedScreen());
  }

  switchToScreen(screen: Screen): void {
    try {
      localStorage.setItem(SCREEN_KEY, JSON.stringify(screen));
    } catch { /* storage blocked – just don't persist */ }

    this.menuController.hide();
    this.maingameController.hide();
    this.multidivController.hide();
    this.fractiongameController.hide();

    switch (screen.type) {
      case "menu": this.menuController.show(); break;
      case "maingame": this.maingameController.show(); break;
      case "multidivgame": this.multidivController.show(); break;
      case "fractiongame": this.fractiongameController.show(); break;
    }
  }

  private loadSavedScreen(): Screen {
    try {
      const saved = localStorage.getItem(SCREEN_KEY);
      if (saved) return JSON.parse(saved) as Screen;
    } catch { /* bad or missing data */ }
    return { type: "menu" };
  }
}

new App("container");