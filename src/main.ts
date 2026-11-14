import Konva from "konva";
import type { ScreenSwitcher, Screen } from "./types.ts";
import { STAGE_WIDTH, STAGE_HEIGHT, FONT_FAMILY } from "./constants.ts";
import { saveScreen, loadScreen, loadProgression } from "./storage.ts";
import { MenuScreenController } from "./screens/MenuScreen/MenuScreenController.ts";
import { FractionSortScreenController } from "./screens/FractionSortScreen/FractionSortScreenController.ts";
import { MainGameScreenController } from "./screens/MainGameScreen/MainGameScreenController.ts";
import { MultiplicationDivisionScreenController } from "./screens/MultiplicationDivisionScreen/MultiplicationDivisionScreenController.ts";
import { AdventureMapScreenController } from "./screens/AdventureMapScreen/AdventureMapScreenController.ts";
import { MainProblemScreenController } from "./screens/MainProblemScreen/MainProblemScreenController.ts";
import { SolutionScreenController } from "./screens/SolutionScreen/SolutionScreenController.ts";
import { getLevelDefinition } from "./levels/levelConfig.ts";
import { isLevelUnlocked } from "./levels/progression.ts";


class App implements ScreenSwitcher {
  private stage: Konva.Stage;
  private layer: Konva.Layer;
  private menuController: MenuScreenController;
  private fractiongameController: FractionSortScreenController;
  private maingameController: MainGameScreenController;
  private multidivController: MultiplicationDivisionScreenController;
  private adventureMapController: AdventureMapScreenController;
  private mainProblemController: MainProblemScreenController;
  private solutionController: SolutionScreenController;

  constructor(container: string) {
    this.stage = new Konva.Stage({ container, width: STAGE_WIDTH, height: STAGE_HEIGHT });
    this.layer = new Konva.Layer();
    this.stage.add(this.layer);

    this.menuController = new MenuScreenController(this);
    this.fractiongameController = new FractionSortScreenController(this);
    this.maingameController = new MainGameScreenController(this);
    this.multidivController = new MultiplicationDivisionScreenController(this);
    this.adventureMapController = new AdventureMapScreenController(this);
    this.mainProblemController = new MainProblemScreenController(this);
    this.solutionController = new SolutionScreenController();

    this.layer.add(this.menuController.getView().getGroup());
    this.layer.add(this.fractiongameController.getView().getGroup());
    this.layer.add(this.maingameController.getView().getGroup());
    this.layer.add(this.multidivController.getView().getGroup());
    this.layer.add(this.adventureMapController.getView().getGroup());
    this.layer.add(this.mainProblemController.getView().getGroup());
    this.layer.add(this.solutionController.getView().getGroup());


    this.layer.draw();
    // Konva draws on a canvas, so redraw once the web font has loaded
    document.fonts.load(`20px ${FONT_FAMILY}`).then(() => this.layer.draw());

    // Reopen the last screen (falls back to the menu if nothing is saved)
    this.switchToScreen(loadScreen());
  }

  switchToScreen(screen: Screen): void {
    if (screen.type === "mainproblem") screen = checkLevelScreen(screen);
    saveScreen(screen.type === "solution" ? { type: "adventuremap", topic: screen.topic } : screen);

    this.menuController.hide();
    this.maingameController.hide();
    this.multidivController.hide();
    this.fractiongameController.hide();
    this.adventureMapController.hide();
    this.mainProblemController.hide();
    this.solutionController.hide();

    switch (screen.type) {
      case "menu": this.menuController.show(); break;
      case "maingame": this.maingameController.show(); break;
      case "adventuremap":
        this.adventureMapController.setTopic(screen.topic);
        this.adventureMapController.show();
        break;
      case "mainproblem":
        this.mainProblemController.setLevel(screen.topic, screen.difficulty);
        this.mainProblemController.show();
        break;
      case "multidivgame": this.multidivController.show(); break;
      case "solution":
        this.solutionController.setProblem(screen.problem);
        this.solutionController.show();
        break;
      case "fractiongame": this.fractiongameController.show(); break;
    }
  }
}

/**
 * A level screen can come from old saved data, so check it before opening:
 * a locked or unknown level opens that topic's map instead, and an unknown topic opens the menu.
 */
function checkLevelScreen(screen: Extract<Screen, { type: "mainproblem" }>): Screen {
  let level;
  try {
    level = getLevelDefinition(screen.topic);
  } catch {
    return { type: "menu" };
  }
  return isLevelUnlocked(level, loadProgression(level), screen.difficulty)
    ? screen
    : { type: "adventuremap", topic: screen.topic };
}

new App("container");
