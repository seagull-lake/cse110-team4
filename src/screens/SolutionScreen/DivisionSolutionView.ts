import Konva from "konva";
import type {DivisionBoxMethod} from "../../problem-engine/MainGameProblemGenerator";

export class DivisionSolutionView{
    private readonly group = new Konva.Group();
    render(division: DivisionBoxMethod): void {

        this.group.destroyChildren();
        
    }

  getGroup(): Konva.Group {
    return this.group;
  }
}
    