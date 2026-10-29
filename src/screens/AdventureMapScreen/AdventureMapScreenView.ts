import Konva from "konva";
import type { View } from "../../types.ts";

export class AdventureMapScreenView implements View {
  private readonly group = new Konva.Group({ visible: false });

  getGroup(): Konva.Group { return this.group; }
  show(): void { this.group.visible(true); this.group.getLayer()?.draw(); }
  hide(): void { this.group.visible(false); this.group.getLayer()?.draw(); }
}
