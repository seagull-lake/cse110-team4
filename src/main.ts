import Konva from "konva";
import type { ScreenSwitcher, Screen } from "./types.ts";
import { STAGE_WIDTH, STAGE_HEIGHT } from "./constants.ts";
import { MenuScreenController } from "./screens/MenuScreen/MenuScreenController.ts";
import { FractionSortScreenController } from "./screens/FractionSortScreen/FractionSortScreenController.ts";
import { MainGameScreenController } from "./screens/MainGameScreen/MainGameScreenController.ts";
import { MultiplicationDivisionScreenController } from "./screens/MultiplicationDivisionScreen/MultiplicationDivisionScreenController.ts";

class App implements ScreenSwitcher {
  private stage: Konva.Stage;
  private layer: Konva.Layer;
  private menuController: MenuScreenController;
  private fracgameController: FractionSortScreenController;
  private maingameController: MainGameScreenController;
  private multidivController: MultiplicationDivisionScreenController;

  constructor(container: string) {
    this.stage = new Konva.Stage({ container, width: STAGE_WIDTH, height: STAGE_HEIGHT });
    this.layer = new Konva.Layer();
    this.stage.add(this.layer);

    this.menuController = new MenuScreenController(this);
    this.fracgameController = new FractionSortScreenController(this);
    this.maingameController = new MainGameScreenController(this);
    this.multidivController = new MultiplicationDivisionScreenController(this);

    this.layer.add(this.menuController.getView().getGroup());
    this.layer.add(this.fracgameController.getView().getGroup());
    this.layer.add(this.maingameController.getView().getGroup());
    this.layer.add(this.multidivController.getView().getGroup());


    this.layer.draw();
    this.menuController.show();
  }

  switchToScreen(screen: Screen): void {
    this.menuController.hide();
    this.fracgameController.hide();
    this.maingameController.hide();
    this.multidivController.hide();
    

    switch (screen.type) {
      case "menu": this.menuController.show(); break;
      case "maingame": this.maingameController.show(); break;
      case "fractiongame": this.fracgameController.show(); break;
      case "multiplicationgame": this.multidivController.show(); break;
    }
  }
}

new App("container");